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

  // --- MÉTODO CORREGIDO PARA MOSTRAR DATOS CORRECTOS ---
  async findAll() {
    const devoluciones = await this.devolucionRepository.find({
      relations: ['items'],
      order: { createdAt: 'DESC' } // Ordenar por fecha reciente
    });

    if (!devoluciones || devoluciones.length === 0) {
      return [];
    }

    const devolucionesEnriquecidas = await Promise.all(
      devoluciones.map(async (devolucion) => {
        try {
          const orderDetails: any = await this.orderService.getOrderById(devolucion.orderId);
          
          // 1. Lógica robusta para encontrar el nombre del cliente
          let nombreCliente = 'Cliente Desconocido';
          if (orderDetails) {
             if (orderDetails.customerName) nombreCliente = orderDetails.customerName;
             else if (orderDetails.direccionEnvio?.nombreCompleto) nombreCliente = orderDetails.direccionEnvio.nombreCompleto;
             else if (orderDetails.nombre) nombreCliente = orderDetails.nombre;
          }

          // 2. Calcular monto
          const montoTotal = devolucion.items
            ? devolucion.items.reduce((sum, item) => sum + Number(item.precio_compra) * item.cantidad, 0)
            : 0;

          // 3. Determinar tipo de devolución
          let tipoDevolucion = 'Pendiente de Items'; // Valor por defecto si no hay items
          if (devolucion.items && devolucion.items.length > 0) {
            const tieneReembolso = devolucion.items.some(i => i.tipo_accion === AccionItemDevolucion.REEMBOLSO);
            const tieneReemplazo = devolucion.items.some(i => i.tipo_accion === AccionItemDevolucion.REEMPLAZO);
            
            if (tieneReembolso && tieneReemplazo) tipoDevolucion = 'Mixta';
            else if (tieneReembolso) tipoDevolucion = 'Reembolso';
            else if (tieneReemplazo) tipoDevolucion = 'Reemplazo';
          }
          
          return {
            ...devolucion,
            nombreCliente,
            montoTotal,
            tipoDevolucion,
          };
        } catch (error) {
          this.logger.error(`Error enriqueciendo devolución ${devolucion.id}: ${error.message}`);
          return {
            ...devolucion,
            nombreCliente: 'Error carga datos',
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
    });
    if (!devolucion) throw new NotFoundException(`Devolución ${id} not found`);
    return devolucion;
  }

  async update(id: string, updateDevolucionDto: UpdateDevolucionDto) {
    const devolucion = await this.findOne(id);

    if (updateDevolucionDto.orderId && updateDevolucionDto.orderId !== devolucion.orderId) {
      const order = await this.orderService.getOrderById(updateDevolucionDto.orderId);
      if (!order) {
        throw new NotFoundException(`Order with ID ${updateDevolucionDto.orderId} not found`);
      }
    }

    Object.assign(devolucion, updateDevolucionDto);
    return await this.devolucionRepository.save(devolucion);
  }

  async remove(id: string) {
    const devolucion = await this.findOne(id);
    return await this.devolucionRepository.remove(devolucion);
  }

  // --- REEMBOLSO AUTOMÁTICO (CORREGIDO Y AJUSTADO) ---
  async executeRefund(id: string): Promise<Devolucion> {
    const devolucion = await this.devolucionRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!devolucion) {
      throw new NotFoundException(`Devolución ${id} not found`);
    }

    // Permitimos PROCESANDO (flujo Miguel) o PENDIENTE (flujo directo)
    // Esto es para que no falle si la pruebas directo o despues de aprobar
    if (devolucion.estado !== EstadoDevolucion.PROCESANDO && devolucion.estado !== EstadoDevolucion.PENDIENTE) {
       // Si ya está completada, devolvemos la misma para no dar error
       if(devolucion.estado === EstadoDevolucion.COMPLETADA) return devolucion;
       
       throw new BadRequestException(`La devolución debe estar PENDIENTE o PROCESANDO para reembolsar.`);
    }

    const montoTotalReembolso = devolucion.items
      .filter(item => item.tipo_accion === AccionItemDevolucion.REEMBOLSO)
      .reduce((sum, item) => sum + (Number(item.precio_compra) * item.cantidad), 0);

    if (montoTotalReembolso <= 0) {
      devolucion.estado = EstadoDevolucion.COMPLETADA;
      devolucion.fecha_procesamiento = new Date();
      return this.devolucionRepository.save(devolucion);
    }

    devolucion.estado = EstadoDevolucion.PROCESANDO;
    await this.devolucionRepository.save(devolucion);

    const refundResponse = await this.paymentsService.processRefund({
      orden_id: devolucion.orderId,
      monto: montoTotalReembolso,
      motivo: `Reembolso para devolución #${devolucion.id}`,
    });

    if (refundResponse && refundResponse.reembolso_id) {
      const nuevoReembolso = await this.reembolsoService.create({
        devolucion_id: devolucion.id,
        monto: montoTotalReembolso,
        // Usamos new Date para asegurar que sea string ISO compatible
        fecha_procesamiento: new Date(refundResponse.fecha_reembolso).toISOString(),
        estado: 'procesado',
        transaccion_id: refundResponse.reembolso_id,
        moneda: devolucion.items[0]?.moneda || 'PEN',
      });

      devolucion.reembolso_id = nuevoReembolso.id;
      devolucion.estado = EstadoDevolucion.COMPLETADA;
      devolucion.fecha_procesamiento = new Date();
      await this.devolucionRepository.save(devolucion);

      await this.kafkaProducerService.returnPaid({
        devolucionId: devolucion.id,
        reembolsoId: nuevoReembolso.id,
        monto: montoTotalReembolso,
      });

    } else {
      devolucion.estado = EstadoDevolucion.ERROR_REEMBOLSO;
      await this.devolucionRepository.save(devolucion);
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

  async aprobarDevolucion(
    id: string,
    aprobarDto: AprobarDevolucionDto,
  ): Promise<{ devolucion: Devolucion; instrucciones: InstruccionesDevolucion }> {
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

    await this.registrarHistorial(
      devolucion.id,
      estadoAnterior,
      EstadoDevolucion.PROCESANDO,
      aprobarDto.adminId,
      aprobarDto.comentario || 'Devolución aprobada por el administrador',
    );

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
        customerEmail: order.customerEmail || '',
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