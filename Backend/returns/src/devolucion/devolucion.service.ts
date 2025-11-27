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
  ) {}
  async create(createDevolucionDto: CreateDevolucionDto) {

    const order = await this.orderService.getOrderById(createDevolucionDto.orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${createDevolucionDto.orderId} not found`);
    }

    const devolucion = this.devolucionRepository.create(createDevolucionDto);

    await this.kafkaProducerService.emitReturnCreated({
      eventType: 'return-created',
      data: devolucion,
      timestamp: new Date().toISOString(),
    });
    return this.devolucionRepository.save(devolucion);
  }

  async findAll() {
    return await this.devolucionRepository.find({
      relations: ['historial', 'items', 'reembolso', 'reemplazo'],
    });
  }

  async findOne(id: string) {
    const devolucion = await this.devolucionRepository.findOne({
      where: { id },
      relations: ['historial', 'items', 'reembolso', 'reemplazo'],
    });
    if (!devolucion) throw new NotFoundException(`Devolución ${id} not found`);
    return devolucion;
  }

  async update(id: string, updateDevolucionDto: UpdateDevolucionDto) {
    // Obtener la devolución existente primero
    const devolucion = await this.findOne(id);

    // Si se provee orderId en el DTO y es distinto al actual, verificar que la orden exista
    if (updateDevolucionDto.orderId && updateDevolucionDto.orderId !== devolucion.orderId) {
      const order = await this.orderService.getOrderById(updateDevolucionDto.orderId);
      if (!order) {
        throw new NotFoundException(`Order with ID ${updateDevolucionDto.orderId} not found`);
      }
    }

    // Aplicar cambios parciales de forma segura y guardar
    Object.assign(devolucion, updateDevolucionDto);
    return await this.devolucionRepository.save(devolucion);
  }

  async remove(id: string) {
    const devolucion = await this.findOne(id);
    return await this.devolucionRepository.remove(devolucion);
  }

  // --- NUEVO MÉTODO PARA EL REEMBOLSO AUTOMÁTICO ---
  async approveAndRefund(id: string): Promise<Devolucion> {
    // 1. Buscamos la devolución con sus items
    const devolucion = await this.devolucionRepository.findOne({
      where: { id },
      relations: ['items'], // ¡Muy importante cargar los items!
    });

    if (!devolucion) {
      throw new NotFoundException(`Devolución ${id} not found`);
    }

    if (devolucion.estado !== EstadoDevolucion.PENDIENTE) {
      throw new BadRequestException(`La devolución ya está en estado '${devolucion.estado}' y no puede ser procesada.`);
    }

    // 2. Calcular el monto a reembolsar
    const montoTotalReembolso = devolucion.items
      .filter(item => item.tipo_accion === AccionItemDevolucion.REEMBOLSO)
      .reduce((sum, item) => sum + (Number(item.precio_compra) * item.cantidad), 0);

    // Si no hay nada que reembolsar, simplemente completamos la devolución
    if (montoTotalReembolso <= 0) {
      devolucion.estado = EstadoDevolucion.COMPLETADA;
      devolucion.fecha_procesamiento = new Date();
      return this.devolucionRepository.save(devolucion);
    }

    // 3. Actualizar estado a 'PROCESANDO'
    devolucion.estado = EstadoDevolucion.PROCESANDO;
    await this.devolucionRepository.save(devolucion);

    // 4. Llamar al servicio de pagos
    const refundResponse = await this.paymentsService.processRefund({
      orden_id: devolucion.orderId,
      monto: montoTotalReembolso,
      motivo: `Reembolso para devolución #${devolucion.id}`,
    });

    // 5. Manejar la respuesta del servicio de pagos
    if (refundResponse && refundResponse.reembolso_id) {
      // ÉXITO: Creamos el registro de Reembolso en nuestra DB
      const nuevoReembolso = await this.reembolsoService.create({
        devolucion_id: devolucion.id,
        monto: montoTotalReembolso,
        fecha_procesamiento: new Date(refundResponse.fecha_reembolso).toISOString(),
        estado: 'procesado',
        transaccion_id: refundResponse.reembolso_id,
        moneda: devolucion.items[0]?.moneda || 'PEN',
      });

      // Actualizamos la devolución
      devolucion.reembolso_id = nuevoReembolso.id;
      devolucion.estado = EstadoDevolucion.COMPLETADA;
      devolucion.fecha_procesamiento = new Date();
      await this.devolucionRepository.save(devolucion);

      // Emitimos evento a Kafka
      await this.kafkaProducerService.returnPaid({
        devolucionId: devolucion.id,
        reembolsoId: nuevoReembolso.id,
        monto: montoTotalReembolso,
      });

    } else {
      // ERROR: Actualizamos la devolución a estado de error
      devolucion.estado = EstadoDevolucion.ERROR_REEMBOLSO;
      await this.devolucionRepository.save(devolucion);
      // Opcional: emitir un evento a Kafka de `return-refund-failed`
    }

    return devolucion; }
  /**
   * Manage Return status Updates
   */
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

    // Filtrar items que requieren reemplazo
    const itemsReemplazo = devolucion.items.filter(
      (item) => item.tipo_accion === AccionItemDevolucion.REEMPLAZO,
    );

    const replacementOrders: any[] = [];

    // Si hay items de reemplazo, crear la orden en orders-command
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

    // Registrar en el historial
    await this.registrarHistorial(
      devolucion.id,
      estadoAnterior,
      EstadoDevolucion.COMPLETADA,
      1, // Sistema automático
      `Devolución completada. ${itemsReemplazo.length > 0 ? `${replacementOrders.length} orden(es) de reemplazo creada(s).` : 'Sin items de reemplazo.'}`,
    );

    return {
      devolucion: devolucionActualizada,
      replacementOrders,
      message: `Devolución completada exitosamente. ${replacementOrders.length > 0 ? `Se crearon ${replacementOrders.length} orden(es) de reemplazo.` : ''}`,
    };
  }

  async markAsCancelled(id: string) {
    const devolucion = await this.findOne(id);
    // add logic to verify if can be marked as cancelled
    devolucion.estado = EstadoDevolucion.CANCELADA;
    return await this.devolucionRepository.save(devolucion);
  }

  /**
   * Aprobar una solicitud de devolución
   */
  async aprobarDevolucion(
    id: string,
    aprobarDto: AprobarDevolucionDto,
  ): Promise<{ 
    devolucion: Devolucion; 
    instrucciones: InstruccionesDevolucion;
    replacementOrders: any[];
  }> {
    const devolucion = await this.findOne(id);

    // Validar que la devolución esté en estado PENDIENTE
    if (devolucion.estado !== EstadoDevolucion.PENDIENTE) {
      throw new BadRequestException(
        `No se puede aprobar una devolución en estado ${devolucion.estado}`,
      );
    }

    // Obtener información de la orden
    const order = await this.orderService.getOrderById(devolucion.orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${devolucion.orderId} not found`);
    }

    // Actualizar estado de la devolución
    const estadoAnterior = devolucion.estado;
    devolucion.estado = EstadoDevolucion.PROCESANDO;
    devolucion.fecha_procesamiento = new Date();

    // Guardar la devolución actualizada
    const devolucionActualizada = await this.devolucionRepository.save(devolucion);

    // Registrar en el historial
    await this.registrarHistorial(
      devolucion.id,
      estadoAnterior,
      EstadoDevolucion.PROCESANDO,
      aprobarDto.adminId,
      aprobarDto.comentario || 'Devolución aprobada por el administrador',
    );

    // Generar instrucciones de devolución
    const instrucciones = await this.instruccionesService.generarInstrucciones(
      devolucionActualizada,
      aprobarDto.metodoDevolucion,
    );

    // Emitir evento de aprobación con notificación al cliente
    await this.kafkaProducerService.emitReturnApproved({
      eventType: 'return-approved',
      data: {
        devolucionId: devolucion.id,
        orderId: devolucion.orderId,
        customerId: order.customerId || 'unknown',
        customerName: order.customerName,
        customerEmail: order.customerEmail || '',
        estado: devolucionActualizada.estado,
        numeroAutorizacion: instrucciones.numeroAutorizacion,
        adminId: aprobarDto.adminId,
        comentario: aprobarDto.comentario,
      },
      timestamp: new Date().toISOString(),
    });

    // Emitir evento de instrucciones generadas
    await this.kafkaProducerService.emitReturnInstructionsGenerated({
      eventType: 'return-instructions-generated',
      data: {
        devolucionId: devolucion.id,
        orderId: devolucion.orderId,
        customerId: order.customerId || 'unknown',
        customerName: order.customerName,
        customerEmail: order.customerEmail || '',
        instrucciones,
      },
      timestamp: new Date().toISOString(),
    });

    // Crear órdenes de reemplazo si hay items con tipo_accion = REEMPLAZO
    const replacementOrders = await this.crearOrdenesReemplazo(
      devolucionActualizada,
      order,
    );

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

  /**
   * Rechazar una solicitud de devolución
   */
  async rechazarDevolucion(
    id: string,
    rechazarDto: RechazarDevolucionDto,
  ): Promise<Devolucion> {
    const devolucion = await this.findOne(id);

    // Validar que la devolución esté en estado PENDIENTE
    if (devolucion.estado !== EstadoDevolucion.PENDIENTE) {
      throw new BadRequestException(
        `No se puede rechazar una devolución en estado ${devolucion.estado}`,
      );
    }

    // Obtener información de la orden
    const order = await this.orderService.getOrderById(devolucion.orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${devolucion.orderId} not found`);
    }

    // Actualizar estado de la devolución
    const estadoAnterior = devolucion.estado;
    devolucion.estado = EstadoDevolucion.CANCELADA;
    devolucion.fecha_procesamiento = new Date();

    // Guardar la devolución actualizada
    const devolucionActualizada = await this.devolucionRepository.save(devolucion);

    // Registrar en el historial
    const comentarioCompleto = `Devolución rechazada. Motivo: ${rechazarDto.motivo}${rechazarDto.comentario ? `. ${rechazarDto.comentario}` : ''}`;
    await this.registrarHistorial(
      devolucion.id,
      estadoAnterior,
      EstadoDevolucion.CANCELADA,
      rechazarDto.adminId,
      comentarioCompleto,
    );

    // Emitir evento de rechazo con notificación al cliente
    await this.kafkaProducerService.emitReturnRejected({
      eventType: 'return-rejected',
      data: {
        devolucionId: devolucion.id,
        orderId: devolucion.orderId,
        customerId: order.customerId || 'unknown',
        customerName: order.customerName,
        customerEmail: order.customerEmail || '',
        estado: devolucionActualizada.estado,
        motivo: rechazarDto.motivo,
        comentario: rechazarDto.comentario,
        adminId: rechazarDto.adminId,
      },
      timestamp: new Date().toISOString(),
    });

    return devolucionActualizada;
  }

  /**
   * Registrar un cambio en el historial de la devolución
   */
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
