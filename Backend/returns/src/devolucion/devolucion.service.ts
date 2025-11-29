import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CreateDevolucionDto } from './dto/create-devolucion.dto';
import { UpdateDevolucionDto } from './dto/update-devolucion.dto';
import { AprobarDevolucionDto } from './dto/aprobar-devolucion.dto';
import { RechazarDevolucionDto } from './dto/rechazar-devolucion.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Devolucion } from './entities/devolucion.entity';
import { Repository } from 'typeorm';
import { KafkaProducerService } from '../common/kafka/kafkaprovider.service';
import { OrderService } from './order/order.service';
import { OrderCommandService } from './order/order-command.service';
import { EstadoDevolucion } from '../common/enums/estado-devolucion.enum';
import { AccionItemDevolucion } from '../common/enums/accion-item-devolucion.enum';
import { PaymentsService } from '../payments/payments.service';
import { ReembolsoService } from '../reembolso/reembolso.service';
import { InstruccionesDevolucionService } from './services/instrucciones-devolucion.service';
import { DevolucionHistorial } from '../devolucion-historial/entities/devolucion-historial.entity';
import { InstruccionesDevolucion } from './interfaces/instrucciones-devolucion.interface';
import { NotificationService } from '../common/services/notification.service';
import moment from 'moment-timezone';
@Injectable()
export class DevolucionService {
  private readonly logger = new Logger(DevolucionService.name);

  constructor(
    @InjectRepository(Devolucion)
    private readonly devolucionRepository: Repository<Devolucion>,
    @InjectRepository(DevolucionHistorial)
    private readonly historialRepository: Repository<DevolucionHistorial>,
    private readonly orderService: OrderService,
    private readonly orderCommandService: OrderCommandService,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly paymentsService: PaymentsService,
    private readonly reembolsoService: ReembolsoService,
    private readonly instruccionesService: InstruccionesDevolucionService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createDevolucionDto: CreateDevolucionDto) {
    const order = await this.orderService.getOrderById(createDevolucionDto.orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${createDevolucionDto.orderId} not found`);
    }

    // --- LÓGICA PARA GENERAR ID LEGIBLE (DEV-YYYYMMDD-XXXXXX) ---
    
    // 1. Buscar la última devolución para obtener el correlativo
    const lastDevolucion = await this.devolucionRepository.find({
      order: { correlativo: 'DESC' },
      take: 1
    });

    // 2. Calcular el siguiente número
    const nextCorrelativo = (lastDevolucion[0]?.correlativo || 0) + 1;

    // 3. Generar el string (Ej: DEV-20251128-000001)
    const fechaStr = moment().tz('America/Lima').format('YYYYMMDD');
    const codDevolucion = `DEV-${fechaStr}-${nextCorrelativo.toString().padStart(6, '0')}`;

    // 4. Crear la entidad con los nuevos campos
    const devolucion = this.devolucionRepository.create({
      ...createDevolucionDto,
      codDevolucion: codDevolucion,
      correlativo: nextCorrelativo,
    });

    await this.kafkaProducerService.emitReturnCreated({
      eventType: 'return-created',
      data: devolucion,
      timestamp: new Date().toISOString(),
    });
    
    return this.devolucionRepository.save(devolucion);
  }

  // --- MÉTODO CORREGIDO PARA MOSTRAR DATOS CORRECTOS ---
  async findAll() {
    return await this.devolucionRepository.find({
      relations: ['historial', 'items', 'reembolso', 'reemplazos'],
    });
  }

  async findOne(id: string) {
    const devolucion = await this.devolucionRepository.findOne({
      where: { id },
      relations: ['historial', 'items', 'reembolso', 'reemplazos'],
    });
    
    if (!devolucion) throw new NotFoundException(`Devolución ${id} not found`);

    // ENRIQUECER EL DETALLE TAMBIÉN
    try {
        const orderDetails: any = await this.orderService.getOrderById(devolucion.orderId);
        let datosCliente = {
            nombres: 'N/A',
            telefono: 'N/A',
            idUsuario: 'N/A'
        };
        let codOrden = devolucion.orderId;

        if (orderDetails) {
            // Mapeo de datos del cliente desde la orden
            datosCliente.nombres = orderDetails.direccionEnvio?.nombreCompleto || orderDetails.customerName || 'N/A';
            datosCliente.telefono = orderDetails.direccionEnvio?.telefono || 'N/A';
            // Asumiendo que el email viene en la orden o usuarioId
            datosCliente.idUsuario = orderDetails.usuarioId || 'N/A';

            // Código de orden formateado
            if (orderDetails.cod_orden) codOrden = orderDetails.cod_orden;
            else if (orderDetails.codOrden) codOrden = orderDetails.codOrden;
        }

        return {
            ...devolucion,
            datosCliente, // Añadimos objeto con datos del cliente
            codOrden,     // Añadimos código formateado
        };

    } catch (e) {
        this.logger.warn(`No se pudieron cargar detalles extra para devolución ${id}`);
        return devolucion;
    }
  }

  async update(id: string, updateDevolucionDto: UpdateDevolucionDto) {
    const devolucion = await this.findOne(id);
    Object.assign(devolucion, updateDevolucionDto);
    return await this.devolucionRepository.save(devolucion);
  }
  async remove(id: string) {
    const devolucion = await this.findOne(id);
    return await this.devolucionRepository.remove(devolucion);
  }

  // --- REEMBOLSO AUTOMÁTICO (AHORA GUARDA HISTORIAL) ---
  async executeRefund(id: string): Promise<Devolucion> {
    const devolucion = await this.devolucionRepository.findOne({ where: { id }, relations: ['items'] });
    if (!devolucion) throw new NotFoundException(`Devolución ${id} not found`);

    const estadoAnterior = devolucion.estado;

    // Validación de estado
    if (devolucion.estado !== EstadoDevolucion.PROCESANDO && devolucion.estado !== EstadoDevolucion.PENDIENTE) {
       if(devolucion.estado === EstadoDevolucion.COMPLETADA) return devolucion;
       throw new BadRequestException(`La devolución debe estar PENDIENTE o PROCESANDO.`);
    }

    // Calcular monto
    const montoTotalReembolso = devolucion.items
      .filter(item => item.tipo_accion === AccionItemDevolucion.REEMBOLSO)
      .reduce((sum, item) => sum + (Number(item.precio_compra) * item.cantidad), 0);

    // 1. Cambio a Procesando
    if (devolucion.estado === EstadoDevolucion.PENDIENTE) {
        devolucion.estado = EstadoDevolucion.PROCESANDO;
        await this.devolucionRepository.save(devolucion);
        // Registramos historial de "Iniciando proceso"
        await this.registrarHistorial(devolucion.id, estadoAnterior, EstadoDevolucion.PROCESANDO, 1, "Iniciando reembolso automático");
    }

    // 2. Llamada a Pagos
    const refundResponse = await this.paymentsService.processRefund({
      orden_id: devolucion.orderId,
      monto: montoTotalReembolso,
      motivo: `Reembolso para devolución #${devolucion.id}`,
    });

    if (refundResponse && refundResponse.reembolso_id) {
      // 3. ÉXITO
      const nuevoReembolso = await this.reembolsoService.create({
        devolucion_id: devolucion.id,
        monto: montoTotalReembolso,
        fecha_procesamiento: new Date(refundResponse.fecha_reembolso).toISOString(),
        estado: 'procesado',
        transaccion_id: refundResponse.reembolso_id,
        moneda: devolucion.items[0]?.moneda || 'PEN',
      });

      // Actualizamos la devolución
      devolucion.estado = EstadoDevolucion.COMPLETADA;
      devolucion.fecha_procesamiento = new Date();
      await this.devolucionRepository.save(devolucion);

      // --- ¡AQUÍ GUARDAMOS EL HISTORIAL FINAL! ---
      await this.registrarHistorial(
          devolucion.id, 
          EstadoDevolucion.PROCESANDO, 
          EstadoDevolucion.COMPLETADA, 
          1, // ID de sistema/admin
          `Reembolso procesado exitosamente. TX: ${refundResponse.reembolso_id}`
      );

      await this.kafkaProducerService.returnPaid({
        devolucionId: devolucion.id,
        reembolsoId: nuevoReembolso.id,
        monto: montoTotalReembolso,
      });

    } else {
      // 4. ERROR
      devolucion.estado = EstadoDevolucion.ERROR_REEMBOLSO;
      await this.devolucionRepository.save(devolucion);
      
      await this.registrarHistorial(
          devolucion.id, 
          EstadoDevolucion.PROCESANDO, 
          EstadoDevolucion.ERROR_REEMBOLSO, 
          1, 
          "Error al comunicarse con la pasarela de pagos"
      );
    }

    return devolucion; 
  }

  async updateReturnStatus(id: string, status: string) {
    const devolucion = await this.findOne(id);
    devolucion.estado = status as EstadoDevolucion;
    return await this.devolucionRepository.save(devolucion);
  }

  /**
   * Marcar una devolución como completada
   * Si hay items de reemplazo, crea automáticamente una orden en orders-command
   */
  async markAsCompleted(id: string) {
    const devolucion = await this.devolucionRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!devolucion) {
      throw new NotFoundException(`Devolución ${id} no encontrada`);
    }

    // Validar que esté en un estado apropiado para completar
    if (devolucion.estado === EstadoDevolucion.COMPLETADA) {
      throw new BadRequestException('La devolución ya está completada');
    }

    if (devolucion.estado === EstadoDevolucion.CANCELADA) {
      throw new BadRequestException('No se puede completar una devolución cancelada');
    }

    // Obtener información de la orden original
    let order: any = null;
    try {
      order = await this.orderService.getOrderById(devolucion.orderId);
    } catch (error) {
      this.logger.warn(
        `No se pudo obtener información de la orden ${devolucion.orderId}: ${error.message}`,
      );
    }

    // Filtrar items por tipo de acción
    const itemsReemplazo = devolucion.items.filter(
      (item) => item.tipo_accion === AccionItemDevolucion.REEMPLAZO,
    );

    const itemsReembolso = devolucion.items.filter(
      (item) => item.tipo_accion === AccionItemDevolucion.REEMBOLSO,
    );

    const replacementOrders: any[] = [];
    let refundResult: any = null;

    // Buscar si ya existe un registro de reembolso para esta devolución
    const reembolsoExistente = await this.reembolsoService.findByDevolucionId(id);

    // Procesar items de REEMBOLSO
    if (itemsReembolso.length > 0) {
      this.logger.log(
        `Procesando reembolso para ${itemsReembolso.length} items de la devolución ${id}`,
      );

      try {
        if (reembolsoExistente) {
          // Si ya existe un reembolso registrado, usar esos datos
          this.logger.log(
            `Reembolso ${reembolsoExistente.id} ya existe. Monto: ${reembolsoExistente.monto} ${reembolsoExistente.moneda}`,
          );

          // Si el reembolso está pendiente, procesarlo ahora con payments-mock
          if (reembolsoExistente.estado === 'pendiente' || !reembolsoExistente.transaccion_id) {
            this.logger.log(
              `Procesando pago del reembolso ${reembolsoExistente.id} a través de payments-mock`,
            );

            // Llamar al servicio de pagos para procesar el reembolso
            const refundResponse = await this.paymentsService.processRefund({
              orden_id: devolucion.orderId,
              monto: Number(reembolsoExistente.monto),
              motivo: `Reembolso por devolución ${devolucion.id}`,
            });

            if (refundResponse && refundResponse.reembolso_id) {
              // Actualizar el registro existente con los datos de la transacción
              const reembolsoActualizado = await this.reembolsoService.update(
                reembolsoExistente.id,
                {
                  estado: 'procesado',
                  transaccion_id: refundResponse.reembolso_id,
                  fecha_procesamiento: new Date(refundResponse.fecha_reembolso).toISOString(),
                },
              );

              refundResult = reembolsoActualizado;

              this.logger.log(
                `Reembolso procesado exitosamente. Transacción: ${refundResponse.reembolso_id}`,
              );

              // Emitir evento de reembolso procesado
              await this.kafkaProducerService.returnPaid({
                eventType: 'return-paid',
                data: {
                  devolucionId: devolucion.id,
                  orderId: devolucion.orderId,
                  reembolsoId: reembolsoActualizado.id,
                  transaccionId: refundResponse.reembolso_id,
                  monto: Number(reembolsoActualizado.monto),
                  moneda: reembolsoActualizado.moneda,
                  customerId: order?.customerId || 'unknown',
                },
                timestamp: new Date().toISOString(),
              });
            } else {
              this.logger.error(
                `El servicio de pagos no pudo procesar el reembolso ${reembolsoExistente.id}`,
              );
              
              await this.registrarHistorial(
                devolucion.id,
                devolucion.estado,
                devolucion.estado,
                1,
                `Error: El servicio de pagos no pudo procesar el reembolso de ${reembolsoExistente.monto} ${reembolsoExistente.moneda}`,
              );
            }
          } else {
            // El reembolso ya fue procesado previamente
            this.logger.log(
              `Reembolso ${reembolsoExistente.id} ya procesado (transacción: ${reembolsoExistente.transaccion_id})`,
            );
            refundResult = reembolsoExistente;
          }
        } else {
          // No existe registro de reembolso, crear uno nuevo y procesarlo
          this.logger.log(
            `No existe registro de reembolso. Creando nuevo y procesando pago.`,
          );

          const montoTotalReembolso = itemsReembolso.reduce(
            (sum, item) => sum + (Number(item.precio_compra) * item.cantidad),
            0,
          );

          const refundResponse = await this.paymentsService.processRefund({
            orden_id: devolucion.orderId,
            monto: montoTotalReembolso,
            motivo: `Reembolso por devolución ${devolucion.id}`,
          });

          if (refundResponse && refundResponse.reembolso_id) {
            const nuevoReembolso = await this.reembolsoService.create({
              devolucion_id: devolucion.id,
              monto: montoTotalReembolso,
              fecha_procesamiento: new Date(refundResponse.fecha_reembolso).toISOString(),
              estado: 'procesado',
              transaccion_id: refundResponse.reembolso_id,
              moneda: itemsReembolso[0]?.moneda || 'PEN',
            });

            refundResult = nuevoReembolso;

            this.logger.log(
              `Reembolso creado y procesado. ID: ${nuevoReembolso.id}, Transacción: ${refundResponse.reembolso_id}`,
            );

            await this.kafkaProducerService.returnPaid({
              eventType: 'return-paid',
              data: {
                devolucionId: devolucion.id,
                orderId: devolucion.orderId,
                reembolsoId: nuevoReembolso.id,
                transaccionId: refundResponse.reembolso_id,
                monto: montoTotalReembolso,
                moneda: itemsReembolso[0]?.moneda || 'PEN',
                customerId: order?.customerId || 'unknown',
              },
              timestamp: new Date().toISOString(),
            });
          } else {
            this.logger.error(
              `El servicio de pagos no pudo procesar el reembolso`,
            );
            
            await this.registrarHistorial(
              devolucion.id,
              devolucion.estado,
              devolucion.estado,
              1,
              `Error: El servicio de pagos no pudo procesar el reembolso de ${montoTotalReembolso}`,
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Error al procesar reembolso para devolución ${id}: ${error.message}`,
          error.stack,
        );
        
        await this.registrarHistorial(
          devolucion.id,
          devolucion.estado,
          devolucion.estado,
          1,
          `Error al procesar reembolso: ${error.message}`,
        );
      }
    } else {
      this.logger.log(`No hay items de reembolso en la devolución ${id}`);
    }

    // Procesar items de REEMPLAZO
    if (itemsReemplazo.length > 0) {
      this.logger.log(
        `Procesando ${itemsReemplazo.length} items de reemplazo para la devolución ${id}`,
      );

      try {
        // Preparar items para la orden de reemplazo
        const orderItems = itemsReemplazo.map((item) => ({
          productId: item.producto_id,
          quantity: item.cantidad,
          price: Number(item.precio_compra),
          productDetails: {
            motivo: item.motivo,
          },
        }));

        // Crear la orden de reemplazo
        const replacementOrder = await this.orderCommandService.createReplacementOrder(
          order?.customerId || 'unknown',
          orderItems,
          devolucion.orderId,
          devolucion.id,
          null, // shippingAddress - se construye en el servicio
        );

        replacementOrders.push(replacementOrder);

        this.logger.log(
          `Orden de reemplazo ${replacementOrder.id} creada exitosamente para la devolución ${id}`,
        );

        // Emitir evento de reemplazo enviado
        await this.kafkaProducerService.emitReplacementSent({
          eventType: 'replacement-sent',
          data: {
            devolucionId: devolucion.id,
            originalOrderId: devolucion.orderId,
            replacementOrderId: replacementOrder.id,
            customerId: order?.customerId || 'unknown',
            items: orderItems,
            totalItems: itemsReemplazo.length,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        this.logger.error(
          `Error al crear orden de reemplazo para devolución ${id}: ${error.message}`,
          error.stack,
        );
        
        // Registrar el error en el historial pero no bloquear la completación
        await this.registrarHistorial(
          devolucion.id,
          devolucion.estado,
          devolucion.estado,
          1, // Sistema automático
          `Error al crear orden de reemplazo: ${error.message}`,
        );
      }
    } else {
      this.logger.log(`No hay items de reemplazo en la devolución ${id}`);
    }

    // Actualizar estado a COMPLETADA
    const estadoAnterior = devolucion.estado;
    devolucion.estado = EstadoDevolucion.COMPLETADA;
    devolucion.fecha_procesamiento = new Date();
    
    const devolucionActualizada = await this.devolucionRepository.save(devolucion);

    // Construir mensaje de resumen
    const summaryParts: string[] = [];
    if (itemsReembolso.length > 0) {
      summaryParts.push(
        refundResult 
          ? `Reembolso procesado: ${refundResult.monto} ${refundResult.moneda}`
          : `${itemsReembolso.length} item(s) de reembolso (pendiente de proceso manual)`
      );
    }
    if (itemsReemplazo.length > 0) {
      summaryParts.push(`${replacementOrders.length} orden(es) de reemplazo creada(s)`);
    }
    if (summaryParts.length === 0) {
      summaryParts.push('Sin items de reembolso o reemplazo');
    }

    // Registrar en el historial
    await this.registrarHistorial(
      devolucion.id,
      estadoAnterior,
      EstadoDevolucion.COMPLETADA,
      1, // Sistema automático
      `Devolución completada. ${summaryParts.join('. ')}.`,
    );

    return {
      devolucion: devolucionActualizada,
      replacementOrders,
      refund: refundResult,
      summary: {
        itemsReembolso: itemsReembolso.length,
        itemsReemplazo: itemsReemplazo.length,
        reembolsoProcesado: !!refundResult,
        ordenesReemplazoCreadas: replacementOrders.length,
      },
      message: `Devolución completada exitosamente. ${summaryParts.join('. ')}.`,
    };
  }

  async markAsCancelled(id: string) {
    const devolucion = await this.findOne(id);
    devolucion.estado = EstadoDevolucion.CANCELADA;
    return await this.devolucionRepository.save(devolucion);
  }

  async aprobarDevolucion(
    id: string,
    aprobarDto: AprobarDevolucionDto,
  ): Promise<{ 
    devolucion: Devolucion; 
    instrucciones: InstruccionesDevolucion;
    replacementOrders: any[];
  }> {
    const devolucion = await this.findOne(id);

    if (devolucion.estado !== EstadoDevolucion.PENDIENTE) {
      throw new BadRequestException(
        `No se puede aprobar una devolución en estado ${devolucion.estado}`,
      );
    }

    const order = await this.orderService.getOrderById(devolucion.orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${devolucion.orderId} not found`);
    }

    const estadoAnterior = devolucion.estado;
    devolucion.estado = EstadoDevolucion.PROCESANDO;
    devolucion.fecha_procesamiento = new Date();

    const devolucionActualizada = await this.devolucionRepository.save(devolucion);

    const instrucciones = await this.instruccionesService.generarInstrucciones(
      devolucionActualizada,
      aprobarDto.metodoDevolucion,
    );

    await this.kafkaProducerService.emitReturnApproved({
      eventType: 'return-approved',
      data: {
        devolucionId: devolucion.id,
        orderId: devolucion.orderId,
        customerId: order.customerId || 'unknown',
        customerName: order.customerName,
        estado: devolucionActualizada.estado,
        numeroAutorizacion: instrucciones.numeroAutorizacion,
        adminId: aprobarDto.adminId,
        comentario: aprobarDto.comentario,
      },
      timestamp: new Date().toISOString(),
    });

    await this.kafkaProducerService.emitReturnInstructionsGenerated({
      eventType: 'return-instructions-generated',
      data: {
        devolucionId: devolucion.id,
        orderId: devolucion.orderId,
        customerId: order.customerId || 'unknown',
        customerName: order.customerName,
        instrucciones,
      },
      timestamp: new Date().toISOString(),
    });

    // Crear órdenes de reemplazo si hay items con tipo_accion = REEMPLAZO
    const replacementOrders = await this.crearOrdenesReemplazo(
      devolucionActualizada,
      order,
    );

    // Enviar notificación al servicio de notifs
    await this.notificationService.sendDevolucionApprovalNotification({
      devolucionId: devolucion.id,
      orderId: devolucion.orderId,
      customerId: order.customerId || 'unknown',
      customerName: order.customerName,
      customerEmail: order.customerEmail || '',
      estado: devolucionActualizada.estado,
      numeroAutorizacion: instrucciones.numeroAutorizacion,
      adminId: aprobarDto.adminId,
      comentario: aprobarDto.comentario,
    });

    return {
      devolucion: devolucionActualizada,
      instrucciones,
      replacementOrders,
    };
  }

  /**
   * Crear órdenes de reemplazo para items con tipo_accion = REEMPLAZO
   */
  private async crearOrdenesReemplazo(devolucion: Devolucion, order: any) {
    // Filtrar items que requieren reemplazo
    const itemsReemplazo = devolucion.items.filter(
      (item) => item.tipo_accion === AccionItemDevolucion.REEMPLAZO,
    );

    if (itemsReemplazo.length === 0) {
      this.logger.log(
        `No hay items de reemplazo para la devolución ${devolucion.id}`,
      );
      return [];
    }

    this.logger.log(
      `Creando orden de reemplazo para ${itemsReemplazo.length} items de la devolución ${devolucion.id}`,
    );

    try {
      // Preparar items para la orden de reemplazo
      const orderItems = itemsReemplazo.map((item) => ({
        productId: item.producto_id,
        quantity: item.cantidad,
        price: Number(item.precio_compra),
      }));

      // Crear una sola orden de reemplazo con todos los items
      const replacementOrder = await this.orderCommandService.createReplacementOrder(
        order.customerId || 'unknown',
        orderItems,
        devolucion.orderId,
        devolucion.id,
        order.shippingAddress, // Usar la misma dirección de la orden original
      );

      this.logger.log(
        `Orden de reemplazo creada exitosamente: ${replacementOrder.id}`,
      );

      // Emitir evento de orden de reemplazo creada
      await this.kafkaProducerService.emitReplacementSent({
        eventType: 'replacement-sent',
        data: {
          devolucionId: devolucion.id,
          originalOrderId: devolucion.orderId,
          replacementOrderId: replacementOrder.id,
          customerId: order.customerId || 'unknown',
          items: orderItems,
          totalItems: itemsReemplazo.length,
        },
        timestamp: new Date().toISOString(),
      });

      return [replacementOrder];
    } catch (error) {
      this.logger.error(
        `Error al crear orden de reemplazo para devolución ${devolucion.id}: ${error.message}`,
        error.stack,
      );
      
      // No lanzar error para no bloquear el proceso de devolución
      // Se puede registrar en el historial o notificar al admin
      await this.registrarHistorial(
        devolucion.id,
        devolucion.estado,
        devolucion.estado,
        0,
        `Error al crear orden de reemplazo: ${error.message}`,
      );

      return [];
    }
  }

  async rechazarDevolucion(
    id: string,
    rechazarDto: RechazarDevolucionDto,
  ): Promise<Devolucion> {
    const devolucion = await this.findOne(id);

    if (devolucion.estado !== EstadoDevolucion.PENDIENTE) {
      throw new BadRequestException(
        `No se puede rechazar una devolución en estado ${devolucion.estado}`,
      );
    }

    const order = await this.orderService.getOrderById(devolucion.orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${devolucion.orderId} not found`);
    }

    const estadoAnterior = devolucion.estado;
    devolucion.estado = EstadoDevolucion.CANCELADA;
    devolucion.fecha_procesamiento = new Date();

    const devolucionActualizada = await this.devolucionRepository.save(devolucion);

    const comentarioCompleto = `Devolución rechazada. Motivo: ${rechazarDto.motivo}${rechazarDto.comentario ? `. ${rechazarDto.comentario}` : ''}`;
    await this.registrarHistorial(
      devolucion.id,
      estadoAnterior,
      EstadoDevolucion.CANCELADA,
      rechazarDto.adminId,
      comentarioCompleto,
    );

    await this.kafkaProducerService.emitReturnRejected({
      eventType: 'return-rejected',
      data: {
        devolucionId: devolucion.id,
        orderId: devolucion.orderId,
        customerId: order.customerId || 'unknown',
        customerName: order.customerName,
        estado: devolucionActualizada.estado,
        motivo: rechazarDto.motivo,
        comentario: rechazarDto.comentario,
        adminId: rechazarDto.adminId,
      },
      timestamp: new Date().toISOString(),
    });

    // Enviar notificación al servicio de notifs
    await this.notificationService.sendDevolucionRejectionNotification({
      devolucionId: devolucion.id,
      orderId: devolucion.orderId,
      customerId: order.customerId || 'unknown',
      customerName: order.customerName,
      customerEmail: order.customerEmail || '',
      estado: devolucionActualizada.estado,
      motivo: rechazarDto.motivo,
      comentario: rechazarDto.comentario,
      adminId: rechazarDto.adminId,
    });

    return devolucionActualizada;
  }

  private async registrarHistorial(
    devolucionId: string,
    estadoAnterior: EstadoDevolucion,
    estadoNuevo: EstadoDevolucion,
    modificadoPorId: number,
    comentario: string,
  ): Promise<void> {
    const historial = this.historialRepository.create({
      devolucion_id: devolucionId,
      estado_anterior: estadoAnterior,
      estado_nuevo: estadoNuevo,
      modificado_por_id: modificadoPorId,
      comentario,
    });

    await this.historialRepository.save(historial);
  }
}