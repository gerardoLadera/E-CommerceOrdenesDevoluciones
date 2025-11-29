import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
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
    // --- LÓGICA PARA GENERAR ID LEGIBLE (DEV-YYYYMMDD-XXXXXX) ---

    // 1. Buscar la última devolución para obtener el correlativo
    const lastDevolucion = await this.devolucionRepository.find({
      order: { correlativo: 'DESC' },
      take: 1,
    });

    // 2. Calcular el siguiente número
    const nextCorrelativo = (lastDevolucion[0]?.correlativo || 0) + 1;

    // 3. Generar el string (Ej: DEV-20251128-000001)
    const fechaStr = moment().tz('America/Lima').format('YYYYMMDD');
    const codDevolucion = `DEV-${fechaStr}-${nextCorrelativo.toString().padStart(6, '0')}`;

    /*/ 4. Crear la entidad con los nuevos campos
    const devolucion = this.devolucionRepository.create({
      ...createDevolucionDto,
      codDevolucion: codDevolucion,
      correlativo: nextCorrelativo,
    });*/

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

  // --- MÉTODO CORREGIDO PARA MOSTRAR DATOS CORRECTOS ---
  async findAll() {
    const devoluciones = await this.devolucionRepository.find({
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });

    if (!devoluciones || devoluciones.length === 0) return [];

    const devolucionesEnriquecidas = await Promise.all(
      devoluciones.map(async (devolucion) => {
        try {
          const orderDetails: any = await this.orderService.getOrderById(
            devolucion.orderId,
          );

          // Extracción robusta de datos
          let nombreCliente = 'N/A';
          let codOrden = 'N/A'; // Variable para el código formateado

          if (orderDetails) {
            // Nombre
            if (orderDetails.customerName)
              nombreCliente = orderDetails.customerName;
            else if (orderDetails.direccionEnvio?.nombreCompleto)
              nombreCliente = orderDetails.direccionEnvio.nombreCompleto;
            else if (orderDetails.nombre) nombreCliente = orderDetails.nombre;

            // Código de orden formateado (si existe en el microservicio de ordenes)
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
            codOrden, // Enviamos el código formateado
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
      order: { historial: { fecha_creacion: 'DESC' } }, // Ordenar historial
    });

    if (!devolucion) throw new NotFoundException(`Devolución ${id} not found`);

    // ENRIQUECER EL DETALLE TAMBIÉN
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
        // Mapeo de datos del cliente desde la orden
        datosCliente.nombres =
          orderDetails.direccionEnvio?.nombreCompleto ||
          orderDetails.customerName ||
          'N/A';
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
        codOrden, // Añadimos código formateado
      };
    } catch (e) {
      this.logger.warn(
        `No se pudieron cargar detalles extra para devolución ${id}`,
      );
      return devolucion;
    }
  }

  async update(id: string, updateDevolucionDto: UpdateDevolucionDto) {
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

  // --- REEMBOLSO AUTOMÁTICO (AHORA GUARDA HISTORIAL) ---
  async executeRefund(id: string): Promise<Devolucion> {
    const devolucion = await this.devolucionRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!devolucion) throw new NotFoundException(`Devolución ${id} not found`);

    const estadoAnterior = devolucion.estado;

    // Validación de estado
    if (
      devolucion.estado !== EstadoDevolucion.PROCESANDO &&
      devolucion.estado !== EstadoDevolucion.PENDIENTE
    ) {
      if (devolucion.estado === EstadoDevolucion.COMPLETADA) return devolucion;
      throw new BadRequestException(
        `La devolución debe estar PENDIENTE o PROCESANDO.`,
      );
    }

    if (devolucion.estado !== EstadoDevolucion.PENDIENTE) {
      throw new BadRequestException(
        `La devolución ya está en estado '${devolucion.estado}' y no puede ser procesada.`,
      );
    }

    // 2. Calcular el monto a reembolsar
    // Calcular monto
    const montoTotalReembolso = devolucion.items
      .filter((item) => item.tipo_accion === AccionItemDevolucion.REEMBOLSO)
      .reduce(
        (sum, item) => sum + Number(item.precio_compra) * item.cantidad,
        0,
      );

    // 1. Cambio a Procesando
    if (devolucion.estado === EstadoDevolucion.PENDIENTE) {
      devolucion.estado = EstadoDevolucion.PROCESANDO;
      await this.devolucionRepository.save(devolucion);
      // Registramos historial de "Iniciando proceso"
      await this.registrarHistorial(
        devolucion.id,
        estadoAnterior,
        EstadoDevolucion.PROCESANDO,
        1,
        'Iniciando reembolso automático',
      );
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
      await this.devolucionRepository.save(devolucion);

      // --- ¡AQUÍ GUARDAMOS EL HISTORIAL FINAL! ---
      await this.registrarHistorial(
        devolucion.id,
        EstadoDevolucion.PROCESANDO,
        EstadoDevolucion.COMPLETADA,
        1, // ID de sistema/admin
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
        1,
        'Error al comunicarse con la pasarela de pagos',
      );
    }

    return devolucion;
  }

  async updateReturnStatus(id: string, status: string) {
    const devolucion = await this.findOne(id);
    devolucion.estado = status as EstadoDevolucion;
    return await this.devolucionRepository.save(devolucion);
  }

  async markAsCompleted(id: string) {
    const devolucion = await this.findOne(id);
    devolucion.estado = EstadoDevolucion.COMPLETADA;
    return await this.devolucionRepository.save(devolucion);
  }

  async markAsCancelled(id: string) {
    const devolucion = await this.findOne(id);
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
  }

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
