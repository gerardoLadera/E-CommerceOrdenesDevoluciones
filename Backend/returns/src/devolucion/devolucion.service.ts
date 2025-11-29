import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
import { DevolutionCreatedEvent } from 'src/common/interfaces/kafka-events.interface';

@Injectable()
export class DevolucionService {
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
  ) {}

  async create(createDevolucionDto: CreateDevolucionDto) {
    const order = await this.orderService.getOrderById(
      createDevolucionDto.orderId,
    );

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${createDevolucionDto.orderId} not found`,
      );
    }

    const devolucion = this.devolucionRepository.create({
      orderId: createDevolucionDto.orderId,
      reason: createDevolucionDto.reason,
      requestedBy: createDevolucionDto.requestedBy,
      estado: EstadoDevolucion.PENDIENTE,
      items: createDevolucionDto.items as any,
    });
    // 3. Persistencia (debería guardar en cascada si la relación está configurada)
    const savedDevolucion = await this.devolucionRepository.save(devolucion);

    await this.registrarHistorial(
      savedDevolucion.id,
      null,
      EstadoDevolucion.PENDIENTE,
      String(createDevolucionDto.requestedBy), // El ID de quien solicitó
      'Solicitud de devolución creada por el cliente',
    );

    // EMITIR EVENTO LIGERO PARA ACTUALIZAR EL ESTADO EN LA ORDEN (orders-query)
    const statusUpdatePayload = {
      orderId: savedDevolucion.orderId,
      devolucionId: savedDevolucion.id,
      tieneDevolucion: true,
    };

    await this.kafkaProducerService.emitReturnCreated({
      eventType: 'return-created',
      data: statusUpdatePayload,
      timestamp: new Date().toISOString(),
    });

    // 4. Recargar Relaciones para el Evento Kafka (Solo si es absolutamente necesario devolverlas)
    const devolucionWithRelations = await this.devolucionRepository.findOne({
      where: { id: savedDevolucion.id },
      //relations: ['items'], // Cargar items_devolucion
      relations: ['items', 'reembolso', 'reemplazo'],
    });

    if (!devolucionWithRelations) {
      throw new BadRequestException(
        'Error al cargar la devolución con relaciones para la emisión del evento.',
      );
    }

    // 5. CONSTRUIR PAYLOAD DESNORMALIZADO Y EMITIR
    const eventPayload = this.buildDevolutionCreatedEvent(
      devolucionWithRelations,
    );

    await this.kafkaProducerService.emitReturnCreated({
      eventType: 'return-created',
      data: eventPayload,
      timestamp: new Date().toISOString(),
    });

    return devolucionWithRelations;
  }

  private buildDevolutionCreatedEvent(dev: Devolucion): DevolutionCreatedEvent {
    // Determinar el tipo de devolución basándose en qué relación existe (reembolso o reemplazo)
    const type: 'REIMBURSEMENT' | 'REPLACEMENT' | null = dev.reembolso_id
      ? 'REIMBURSEMENT'
      : dev.reemplazo_id
        ? 'REPLACEMENT'
        : null;

    return {
      returnId: dev.id,
      orderId: dev.orderId, // Usar 'orden_id' de la entidad Devolucion
      type: type,
      status: dev.estado.toString(),
      createdAt: dev.createdAt,
      reason: dev.reason,
      requestedBy: dev.requestedBy,

      // Mapeo de Items
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

      // Detalles de Reembolso
      reimbursementDetails: dev.reembolso
        ? {
            id: dev.reembolso.id,
            monto: dev.reembolso.monto,
            estado: dev.reembolso.estado,
            transaccion_id: dev.reembolso.transaccion_id,
          }
        : undefined,

      // Detalles de Reemplazo
      replacementDetails: dev.reemplazo
        ? {
            id: dev.reemplazo.id,
            ordenReemplazoId: dev.reemplazo.ordenReemplazoId,
          }
        : undefined,
    } as DevolutionCreatedEvent;
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
      throw new BadRequestException(
        `La devolución ya está en estado '${devolucion.estado}' y no puede ser procesada.`,
      );
    }

    // 2. Calcular el monto a reembolsar
    const montoTotalReembolso = devolucion.items
      .filter((item) => item.tipo_accion === AccionItemDevolucion.REEMBOLSO)
      .reduce(
        (sum, item) => sum + Number(item.precio_compra) * item.cantidad,
        0,
      );

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
        fecha_procesamiento: new Date(
          refundResponse.fecha_reembolso,
        ).toISOString(),
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

    return devolucion;
  }
  /**
   * Manage Return status Updates
   */
  async updateReturnStatus(id: string, status: string) {
    const devolucion = await this.findOne(id);
    devolucion.estado = status as EstadoDevolucion;
    return await this.devolucionRepository.save(devolucion);
  }

  async markAsCompleted(id: string) {
    const devolucion = await this.findOne(id);
    // add logic to verify if can be marked as completed
    devolucion.estado = EstadoDevolucion.COMPLETADA;
    return await this.devolucionRepository.save(devolucion);
  }

  async markAsCancelled(id: string) {
    const devolucion = await this.findOne(id);
    // add logic to verify if can be marked as cancelled
    devolucion.estado = EstadoDevolucion.CANCELADA;
    return await this.devolucionRepository.save(devolucion);
  }

  // Aprobar una solicitud de devolución
  async aprobarDevolucion(
    id: string,
    aprobarDto: AprobarDevolucionDto,
  ): Promise<{
    devolucion: Devolucion;
    instrucciones: InstruccionesDevolucion;
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
      throw new NotFoundException(
        `Order with ID ${devolucion.orderId} not found`,
      );
    }

    // Actualizar estado de la devolución
    const estadoAnterior = devolucion.estado;
    devolucion.estado = EstadoDevolucion.PROCESANDO;
    devolucion.fecha_procesamiento = new Date();

    // Guardar la devolución actualizada
    const devolucionActualizada =
      await this.devolucionRepository.save(devolucion);

    // Registrar en el historial
    await this.registrarHistorial(
      devolucion.id,
      estadoAnterior,
      EstadoDevolucion.PROCESANDO,
      String(aprobarDto.adminId),
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

    return {
      devolucion: devolucionActualizada,
      instrucciones,
    };
  }

  // Rechazar una solicitud de devolución
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
      throw new NotFoundException(
        `Order with ID ${devolucion.orderId} not found`,
      );
    }

    // Actualizar estado de la devolución
    const estadoAnterior = devolucion.estado;
    devolucion.estado = EstadoDevolucion.CANCELADA;
    devolucion.fecha_procesamiento = new Date();

    // Guardar la devolución actualizada
    const devolucionActualizada =
      await this.devolucionRepository.save(devolucion);

    // Registrar en el historial
    const comentarioCompleto = `Devolución rechazada. Motivo: ${rechazarDto.motivo}${rechazarDto.comentario ? `. ${rechazarDto.comentario}` : ''}`;
    await this.registrarHistorial(
      devolucion.id,
      estadoAnterior,
      EstadoDevolucion.CANCELADA,
      String(rechazarDto.adminId),
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

  //Registrar un cambio en el historial de la devolución
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
