import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateDevolucionDto } from './dto/create-devolucion.dto';
import { UpdateDevolucionDto } from './dto/update-devolucion.dto';
import { AprobarDevolucionDto } from './dto/aprobar-devolucion.dto';
import { RechazarDevolucionDto } from './dto/rechazar-devolucion.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Devolucion } from './entities/devolucion.entity';
import { Repository } from 'typeorm';
import { KafkaProducerService } from '../common/kafka/kafkaprovider.service';
import { OrderService } from './order/order.service';
import { InstruccionesDevolucionService } from './services/instrucciones-devolucion.service';
import { DevolucionHistorial } from '../devolucion-historial/entities/devolucion-historial.entity';
import { EstadoDevolucion } from 'src/common/enums/estado-devolucion.enum';
import { InstruccionesDevolucion } from './interfaces/instrucciones-devolucion.interface';

@Injectable()
export class DevolucionService {
  constructor(
    @InjectRepository(Devolucion)
    private readonly devolucionRepository: Repository<Devolucion>,
    @InjectRepository(DevolucionHistorial)
    private readonly historialRepository: Repository<DevolucionHistorial>,
    private readonly orderService: OrderService,
    private readonly kafkaProducerService: KafkaProducerService,
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

  /**
   * Aprobar una solicitud de devolución
   */
  async aprobarDevolucion(
    id: string,
    aprobarDto: AprobarDevolucionDto,
  ): Promise<{ devolucion: Devolucion; instrucciones: InstruccionesDevolucion }> {
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

    return {
      devolucion: devolucionActualizada,
      instrucciones,
    };
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
