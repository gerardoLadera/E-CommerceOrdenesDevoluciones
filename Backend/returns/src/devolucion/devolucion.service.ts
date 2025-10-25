import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDevolucionDto } from './dto/create-devolucion.dto';
import { UpdateDevolucionDto } from './dto/update-devolucion.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Devolucion } from './entities/devolucion.entity';
import { Repository } from 'typeorm';
import { KafkaProducerService } from '../common/kafka/kafkaprovider.service';
import { OrderService } from './order/order.service';

@Injectable()
export class DevolucionService {
  constructor(
    @InjectRepository(Devolucion)
    private readonly devolucionRepository: Repository<Devolucion>,
    private readonly orderService: OrderService,
    private readonly kafkaProducerService: KafkaProducerService,
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
}
