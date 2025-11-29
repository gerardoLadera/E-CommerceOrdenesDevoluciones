import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger, // De ECO-3
} from '@nestjs/common';
import { CreateDevolucionDto } from './dto/create-devolucion.dto';
import { UpdateDevolucionDto } from './dto/update-devolucion.dto';
import { AprobarDevolucionDto } from './dto/aprobar-devolucion.dto';
import { RechazarDevolucionDto } from './dto/rechazar-devolucion.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Devolucion } from './entities/devolucion.entity';
import { Repository } from 'typeorm';
import { KafkaProducerService } from '../common/kafka/kafkaprovider.service';
import { OrderService } from './order/order.service';
import { EstadoDevolucion } from '../common/enums/estado-devolucion.enum';
import { AccionItemDevolucion } from '../common/enums/accion-item-devolucion.enum';
import { PaymentsService } from '../payments/payments.service';
import { ReembolsoService } from '../reembolso/reembolso.service';
import { InstruccionesDevolucionService } from './services/instrucciones-devolucion.service';
import { DevolucionHistorial } from '../devolucion-historial/entities/devolucion-historial.entity';
import { InstruccionesDevolucion } from './interfaces/instrucciones-devolucion.interface';
import { DevolutionCreatedEvent } from 'src/common/interfaces/kafka-events.interface'; // De HEAD
import moment from 'moment-timezone'; // De ECO-3

@Injectable()
export class DevolucionService {
  private readonly logger = new Logger(DevolucionService.name); // De ECO-3

  constructor(
    @InjectRepository(Devolucion)
    private readonly devolucionRepository: Repository<Devolucion>,
    @InjectRepository(DevolucionHistorial)
    private readonly historialRepository: Repository<DevolucionHistorial>,
    private readonly orderService: OrderService,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly paymentsService: PaymentsService,
    private readonly reembolsoService: ReembolsoService,
    private readonly instruccionesService: InstruccionesDevolucionService,
  ) {} // ------------------------------------------------------------------
  //  MÉTODO CREATE (Fusión de lógica de correlativo y Kafka/Historial)
  // ------------------------------------------------------------------

  async create(createDevolucionDto: CreateDevolucionDto) {
    // 1. Verificar la Orden (HEAD y ECO-3)
    const order = await this.orderService.getOrderById(
      createDevolucionDto.orderId,
    );

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${createDevolucionDto.orderId} not found`,
      );
    } // 2. Lógica para generar ID LEGIBLE y correlativo (De ECO-3)

    const lastDevolucion = await this.devolucionRepository.find({
      order: { correlativo: 'DESC' },
      take: 1,
    });
    const nextCorrelativo = (lastDevolucion[0]?.correlativo || 0) + 1;
    const fechaStr = moment().tz('America/Lima').format('YYYYMMDD');
    const codDevolucion = `DEV-${fechaStr}-${nextCorrelativo.toString().padStart(6, '0')}`; // 3. Crear la entidad con todos los campos (Fusión)

    const devolucion = this.devolucionRepository.create({
      orderId: createDevolucionDto.orderId,
      reason: createDevolucionDto.reason,
      requestedBy: createDevolucionDto.requestedBy,
      estado: EstadoDevolucion.PENDIENTE,
      items: createDevolucionDto.items as any,
      codDevolucion: codDevolucion, // De ECO-3
      correlativo: nextCorrelativo, // De ECO-3
    }); // 4. Persistencia

    const savedDevolucion = await this.devolucionRepository.save(devolucion); // 5. Registrar Historial (De HEAD)

    await this.registrarHistorial(
      savedDevolucion.id,
      null,
      EstadoDevolucion.PENDIENTE,
      String(createDevolucionDto.requestedBy),
      'Solicitud de devolución creada por el cliente',
    ); // 6. EMITIR EVENTO LIGERO (Para orders-query o status update) (De HEAD)

    const statusUpdatePayload = {
      orderId: savedDevolucion.orderId,
      devolucionId: savedDevolucion.id,
      tieneDevolucion: true,
    };

    await this.kafkaProducerService.emitReturnCreated({
      eventType: 'return-status-updated', // Cambio el nombre para evitar colisiones con el evento detallado
      data: statusUpdatePayload,
      timestamp: new Date().toISOString(),
    }); // 7. Recargar Relaciones para el Evento Kafka Detallado (De HEAD)

    const devolucionWithRelations = await this.devolucionRepository.findOne({
      where: { id: savedDevolucion.id },
      relations: ['items', 'reembolso', 'reemplazo'],
    });

    if (!devolucionWithRelations) {
      throw new BadRequestException(
        'Error al cargar la devolución con relaciones para la emisión del evento.',
      );
    } // 8. CONSTRUIR PAYLOAD DESNORMALIZADO Y EMITIR (De HEAD)

    const eventPayload = this.buildDevolutionCreatedEvent(
      devolucionWithRelations,
    );

    await this.kafkaProducerService.emitReturnCreated({
      eventType: 'return-created',
      data: eventPayload,
      timestamp: new Date().toISOString(),
    });

    return devolucionWithRelations;
  } // ------------------------------------------------------------------
  //  MÉTODO PRIVADO buildDevolutionCreatedEvent (De HEAD)
  // ------------------------------------------------------------------

  private buildDevolutionCreatedEvent(dev: Devolucion): DevolutionCreatedEvent {
    const type: 'REIMBURSEMENT' | 'REPLACEMENT' | null = dev.reembolso_id
      ? 'REIMBURSEMENT'
      : dev.reemplazo_id
        ? 'REPLACEMENT'
        : null;

    return {
      returnId: dev.id,
      orderId: dev.orderId,
      type: type,
      status: dev.estado.toString(),
      createdAt: dev.createdAt,
      reason: dev.reason,
      requestedBy: dev.requestedBy,

      returnedItems:
        dev.items?.map((item) => ({
          itemId: item.id,
          productId: item.producto_id,
          quantity: item.cantidad,
          motive: item.motivo,
          purchasePrice: item.precio_compra,
          moneda: item.moneda,
          action: item.tipo_accion,
        })) || [],

      reimbursementDetails: dev.reembolso
        ? {
            id: dev.reembolso.id,
            monto: dev.reembolso.monto,
            estado: dev.reembolso.estado,
            transaccion_id: dev.reembolso.transaccion_id,
          }
        : undefined,

      replacementDetails: dev.reemplazo
        ? {
            id: dev.reemplazo.id,
            ordenReemplazoId: dev.reemplazo.ordenReemplazoId,
          }
        : undefined,
    } as DevolutionCreatedEvent;
  } // ------------------------------------------------------------------
  //  MÉTODOS FIND (Se mantiene la versión de ECO-3 por ser más rica)
  // ------------------------------------------------------------------

  async findAll() {
    const devoluciones = await this.devolucionRepository.find({
      relations: ['historial', 'items', 'reembolso', 'reemplazo'],
      order: { createdAt: 'DESC' },
    });

    if (!devoluciones || devoluciones.length === 0) return [];

    const devolucionesEnriquecidas = await Promise.all(
      devoluciones.map(async (devolucion) => {
        try {
          const orderDetails: any = await this.orderService.getOrderById(
            devolucion.orderId,
          );
          let nombreCliente = 'N/A';
          let codOrden = 'N/A';

          if (orderDetails) {
            if (orderDetails.customerName)
              nombreCliente = orderDetails.customerName;
            else if (orderDetails.direccionEnvio?.nombreCompleto)
              nombreCliente = orderDetails.direccionEnvio.nombreCompleto;
            else if (orderDetails.nombre) nombreCliente = orderDetails.nombre;

            if (orderDetails.cod_orden) codOrden = orderDetails.cod_orden;
            else if (orderDetails.codOrden) codOrden = orderDetails.codOrden;
          }

          const montoTotal = devolucion.items
            ? devolucion.items.reduce(
                (sum, item) => sum + Number(item.precio_compra) * item.cantidad,
                0,
              )
            : 0;

          let tipoDevolucion = 'Pendiente';
          if (devolucion.items && devolucion.items.length > 0) {
            const tieneReembolso = devolucion.items.some(
              (i) => i.tipo_accion === AccionItemDevolucion.REEMBOLSO,
            );
            const tieneReemplazo = devolucion.items.some(
              (i) => i.tipo_accion === AccionItemDevolucion.REEMPLAZO,
            );
            if (tieneReembolso && tieneReemplazo) tipoDevolucion = 'Mixta';
            else if (tieneReembolso) tipoDevolucion = 'Reembolso';
            else if (tieneReemplazo) tipoDevolucion = 'Reemplazo';
          }
          return {
            ...devolucion,
            nombreCliente,
            codOrden,
            montoTotal,
            tipoDevolucion,
          };
        } catch (error) {
          return {
            ...devolucion,
            nombreCliente: 'Error',
            codOrden: 'Error',
            montoTotal: 0,
            tipoDevolucion: 'N/A',
          };
        }
      }),
    );
    return devolucionesEnriquecidas;
  }

  async findOne(id: string) {
    const devolucion = await this.devolucionRepository.findOne({
      where: { id },
      relations: ['historial', 'items', 'reembolso', 'reemplazo'],
      order: { historial: { fechaCreacion: 'DESC' } },
    });
    if (!devolucion) throw new NotFoundException(`Devolución ${id} not found`);

    try {
      const orderDetails: any = await this.orderService.getOrderById(
        devolucion.orderId,
      );
      let datosCliente = {
        nombres: 'N/A',
        telefono: 'N/A',
        idUsuario: 'N/A',
      };
      let codOrden = devolucion.orderId;

      if (orderDetails) {
        datosCliente.nombres =
          orderDetails.direccionEnvio?.nombreCompleto ||
          orderDetails.customerName ||
          'N/A';
        datosCliente.telefono = orderDetails.direccionEnvio?.telefono || 'N/A';
        datosCliente.idUsuario = orderDetails.usuarioId || 'N/A';

        if (orderDetails.cod_orden) codOrden = orderDetails.cod_orden;
        else if (orderDetails.codOrden) codOrden = orderDetails.codOrden;
      }

      return {
        ...devolucion,
        datosCliente,
        codOrden,
      };
    } catch (e) {
      this.logger.warn(
        `No se pudieron cargar detalles extra para devolución ${id}`,
      );
      return devolucion;
    }
  } // ------------------------------------------------------------------
  //  MÉTODO UPDATE (Se mantiene la validación de orderId de HEAD)
  // ------------------------------------------------------------------

  async update(id: string, updateDevolucionDto: UpdateDevolucionDto) {
    const devolucion = await this.findOne(id); // Si se provee orderId en el DTO y es distinto al actual, verificar que la orden exista (De HEAD)
    if (
      updateDevolucionDto.orderId &&
      updateDevolucionDto.orderId !== devolucion.orderId
    ) {
      const order = await this.orderService.getOrderById(
        updateDevolucionDto.orderId,
      );
      if (!order) {
        throw new NotFoundException(
          `Order with ID ${updateDevolucionDto.orderId} not found`,
        );
      }
    }

    Object.assign(devolucion, updateDevolucionDto);
    return await this.devolucionRepository.save(devolucion);
  }

  async remove(id: string) {
    const devolucion = await this.findOne(id);
    return await this.devolucionRepository.remove(devolucion);
  } // ------------------------------------------------------------------
  //  MÉTODO executeRefund (Fusión de lógica y historial)
  // ------------------------------------------------------------------

  async executeRefund(id: string): Promise<Devolucion> {
    const devolucion = await this.devolucionRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!devolucion) throw new NotFoundException(`Devolución ${id} not found`);

    const estadoAnterior = devolucion.estado; // Validación de estado (Unificación de ECO-3)

    if (
      devolucion.estado !== EstadoDevolucion.PROCESANDO &&
      devolucion.estado !== EstadoDevolucion.PENDIENTE
    ) {
      if (devolucion.estado === EstadoDevolucion.COMPLETADA) return devolucion;
      throw new BadRequestException(
        `La devolución debe estar PENDIENTE o PROCESANDO para iniciar el reembolso.`,
      );
    } // Calcular monto (Unificación)

    const montoTotalReembolso = devolucion.items
      .filter((item) => item.tipo_accion === AccionItemDevolucion.REEMBOLSO)
      .reduce(
        (sum, item) => sum + Number(item.precio_compra) * item.cantidad,
        0,
      );

    // Si no hay monto a reembolsar, no hacemos nada y devolvemos la devolución.
    if (montoTotalReembolso <= 0) {
      this.logger.warn(`No hay items de reembolso para la devolución ${id}.`);
      return devolucion;
    } // 1. Transición a Procesando si estaba en Pendiente (De ECO-3)

    if (devolucion.estado === EstadoDevolucion.PENDIENTE) {
      devolucion.estado = EstadoDevolucion.PROCESANDO;
      await this.devolucionRepository.save(devolucion);
      await this.registrarHistorial(
        devolucion.id,
        estadoAnterior,
        EstadoDevolucion.PROCESANDO,
        'Sistema', // ID genérico para el sistema
        'Iniciando reembolso automático (ejecuteRefund).',
      );
    } // 2. Llamada a Pagos

    const refundResponse = await this.paymentsService.processRefund({
      orden_id: devolucion.orderId,
      monto: montoTotalReembolso,
      motivo: `Reembolso para devolución #${devolucion.codDevolucion || devolucion.id}`,
    });

    if (refundResponse && refundResponse.reembolso_id) {
      // 3. ÉXITO
      const nuevoReembolso = await this.reembolsoService.create({
        devolucion_id: devolucion.id,
        monto: montoTotalReembolso,
        fecha_procesamiento: new Date(
          refundResponse.fecha_reembolso,
        ).toISOString(),
        estado: 'procesado',
        transaccion_id: refundResponse.reembolso_id,
        moneda: devolucion.items[0]?.moneda || 'PEN',
      });

      devolucion.reembolso_id = nuevoReembolso.id;
      devolucion.estado = EstadoDevolucion.COMPLETADA;
      devolucion.fecha_procesamiento = new Date();
      await this.devolucionRepository.save(devolucion); // Historial y Kafka (De ECO-3 y HEAD)

      await this.registrarHistorial(
        devolucion.id,
        EstadoDevolucion.PROCESANDO,
        EstadoDevolucion.COMPLETADA,
        'Sistema',
        `Reembolso procesado exitosamente. TX: ${refundResponse.reembolso_id}`,
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
        'Sistema',
        'Error al comunicarse con la pasarela de pagos. Requiere intervención manual.',
      );
    }

    return devolucion;
  } // ------------------------------------------------------------------
  //  MÉTODOS FALTANTES (Para mantener las pruebas funcionales)
  // ------------------------------------------------------------------
  // Método approveAndRefund (Implementación necesaria para tests)

  async approveAndRefund(id: string): Promise<Devolucion> {
    // Lógica mínima para que las pruebas pasen, asumiendo que se moverá a executeRefund si es solo reembolso.
    // Si este método es para aprobar un reemplazo/mixto y luego ejecutar el reembolso, la lógica es:

    const devolucion = await this.devolucionRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!devolucion) throw new NotFoundException(`Devolución ${id} not found`);

    if (devolucion.estado !== EstadoDevolucion.PENDIENTE) {
      throw new BadRequestException(
        `Solo se pueden aprobar devoluciones en estado PENDIENTE. Estado actual: ${devolucion.estado}`,
      );
    } // La aprobación mueve a PROCESANDO. Si hay reembolso, llama a executeRefund.

    const tieneReembolso = devolucion.items.some(
      (i) => i.tipo_accion === AccionItemDevolucion.REEMBOLSO,
    );

    if (tieneReembolso) {
      // Lógica de la prueba: transicionar y luego ejecutar reembolso.
      devolucion.estado = EstadoDevolucion.PROCESANDO;
      await this.devolucionRepository.save(devolucion);
      return this.executeRefund(id);
    } else {
      // Solo reemplazo, se marca directamente como COMPLETED o espera acción de reemplazo.
      devolucion.estado = EstadoDevolucion.COMPLETADA; // Asumimos COMPLETED para el caso de no reembolso.
      return this.devolucionRepository.save(devolucion);
    }
  } // Métodos de estado simples (De HEAD y ECO-3)
  async updateReturnStatus(id: string, status: string) {
    const devolucion = await this.findOne(id);
    const estadoAnterior = devolucion.estado;
    devolucion.estado = status as EstadoDevolucion;

    await this.registrarHistorial(
      id,
      estadoAnterior,
      devolucion.estado,
      'Sistema/API',
      `Actualización de estado a ${devolucion.estado}`,
    );
    return await this.devolucionRepository.save(devolucion);
  }

  async markAsCompleted(id: string) {
    return this.updateReturnStatus(id, EstadoDevolucion.COMPLETADA);
  }

  async markAsCancelled(id: string) {
    return this.updateReturnStatus(id, EstadoDevolucion.CANCELADA);
  } // ------------------------------------------------------------------
  //  APROBAR/RECHAZAR (Asegurando registro de historial y lógica completa)
  // ------------------------------------------------------------------

  async aprobarDevolucion(
    id: string,
    aprobarDto: AprobarDevolucionDto,
  ): Promise<{
    devolucion: Devolucion;
    instrucciones: InstruccionesDevolucion;
  }> {
    const devolucion = await this.findOne(id);

    if (devolucion.estado !== EstadoDevolucion.PENDIENTE) {
      throw new BadRequestException(
        `No se puede aprobar una devolución en estado ${devolucion.estado}`,
      );
    }

    const order = await this.orderService.getOrderById(devolucion.orderId);
    if (!order) {
      throw new NotFoundException(
        `Order with ID ${devolucion.orderId} not found`,
      );
    }

    const estadoAnterior = devolucion.estado;
    devolucion.estado = EstadoDevolucion.PROCESANDO;
    devolucion.fecha_procesamiento = new Date();

    const devolucionActualizada =
      await this.devolucionRepository.save(devolucion); // Registrar en el historial (De HEAD)

    await this.registrarHistorial(
      devolucion.id,
      estadoAnterior,
      EstadoDevolucion.PROCESANDO,
      String(aprobarDto.adminId),
      aprobarDto.comentario || 'Devolución aprobada por el administrador',
    ); // Generar instrucciones de devolución

    const instrucciones = await this.instruccionesService.generarInstrucciones(
      devolucionActualizada,
      aprobarDto.metodoDevolucion,
    ); // Emisión de eventos Kafka

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
    }); // Evento de instrucciones generadas

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

    return {
      devolucion: devolucionActualizada,
      instrucciones,
    };
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
      throw new NotFoundException(
        `Order with ID ${devolucion.orderId} not found`,
      );
    }

    const estadoAnterior = devolucion.estado;
    devolucion.estado = EstadoDevolucion.CANCELADA;
    devolucion.fecha_procesamiento = new Date();

    const devolucionActualizada =
      await this.devolucionRepository.save(devolucion);

    const comentarioCompleto = `Devolución rechazada. Motivo: ${rechazarDto.motivo}${rechazarDto.comentario ? `. ${rechazarDto.comentario}` : ''}`;
    await this.registrarHistorial(
      devolucion.id,
      estadoAnterior,
      EstadoDevolucion.CANCELADA,
      String(rechazarDto.adminId),
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

    return devolucionActualizada;
  } // ------------------------------------------------------------------
  //  MÉTODO PRIVADO registrarHistorial (Unificación)
  // ------------------------------------------------------------------

  private async registrarHistorial(
    devolucionId: string,
    estadoAnterior: EstadoDevolucion | null,
    estadoNuevo: EstadoDevolucion,
    modificadoPorId: string,
    comentario: string,
  ): Promise<void> {
    const historial = this.historialRepository.create({
      devolucionId: devolucionId,
      estadoAnterior: estadoAnterior,
      estadoNuevo: estadoNuevo,
      modificadoPorId: modificadoPorId,
      comentario,
    });

    await this.historialRepository.save(historial);
  }
}
