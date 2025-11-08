import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateDevolucionDto } from './dto/create-devolucion.dto';
import { UpdateDevolucionDto } from './dto/update-devolucion.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Devolucion } from './entities/devolucion.entity';
import { Repository } from 'typeorm';
import { KafkaProducerService } from '../common/kafka/kafkaprovider.service';
import { OrderService } from './order/order.service';
import { EstadoDevolucion } from '../common/enums/estado-devolucion.enum';
import { AccionItemDevolucion } from '../common/enums/accion-item-devolucion.enum';
import { PaymentsService } from '../payments/payments.service';
import { ReembolsoService } from '../reembolso/reembolso.service';

@Injectable()
export class DevolucionService {
  constructor(
    @InjectRepository(Devolucion)
    private readonly devolucionRepository: Repository<Devolucion>,
    private readonly orderService: OrderService,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly paymentsService: PaymentsService,
    private readonly reembolsoService: ReembolsoService,
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

    return devolucion;
  }
}
