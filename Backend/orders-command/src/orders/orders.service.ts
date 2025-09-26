import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { OrderHistory } from './entities/orderHistory.entity';
import { KafkaService } from '../kafka/kafka.service'; 
import moment from 'moment-timezone';
import{ EstadoOrden } from './enums/estado-orden.enum';

@Injectable()
export class OrdersService{
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(OrderHistory)
    private readonly orderHistoryRepository: Repository<OrderHistory>,

    private readonly kafkaService: KafkaService,
  ) {}


  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const fecha = moment().tz('America/Lima').toDate();
    // Crear orden
    const order = this.orderRepository.create({
      orden_id: uuidv4(),
      clienteId: createOrderDto.clienteId,
      totalOrden: createOrderDto.totalOrden,
      moneda: createOrderDto.moneda,
      metadoPago: createOrderDto.metodoPago,
      direccion: createOrderDto.direccion,
      direccionFacturacion: createOrderDto.direccionFacturacion,
      metadata: createOrderDto.metadata,
      notaEnvio: createOrderDto.notaEnvio,
      estado: EstadoOrden.CREADO,
      fechaCreacion: fecha,
      fechaActualizacion: fecha,
    });

    await this.orderRepository.save(order);

    // Crear items
    const items = createOrderDto.orden_items.map((itemDto) =>
      this.orderItemRepository.create({
        orden_id: order.orden_id,
        productoId: itemDto.productoId,
        cantidad: itemDto.cantidad,
        precioUnitario: itemDto.precioUnitario,
        precioTotal: itemDto.precioTotal,
        detalleProducto: itemDto.detalleProducto,
      }),
    );

    await this.orderItemRepository.save(items);

    // Guardar historial de creación
    const history = this.orderHistoryRepository.create({
        orden_id: order.orden_id,
        estadoAnterior: null,
        estadoNuevo: EstadoOrden.CREADO,
        fechaModificacion: fecha,
        modificadoPor: null,
        motivo: 'Creación de orden desde checkout',
    });

    await this.orderHistoryRepository.save(history);

    const eventPayload = {
      eventType: 'ORDEN_CREADA',
      data: {
        orden_id: order.orden_id,
        clienteId: order.clienteId,
        totalOrden: order.totalOrden,
        moneda: order.moneda,
        estado: order.estado,
        direccion: order.direccion,
        direccionFacturacion: order.direccionFacturacion,
        metodoPago: order.metadoPago,
        metadata: order.metadata,
        notaEnvio: order.notaEnvio,
        orden_items: items.map(item => ({
          producto_id: item.productoId,
          cantidad: item.cantidad,
          precio_unitario: item.precioUnitario,
          precio_total: item.precioTotal,
          detalle_producto: item.detalleProducto,
        })),
        fechaCreacion: order.fechaCreacion,
      },
      timestamp: new Date().toISOString(),
    };

    await this.kafkaService.emitOrderCreated(eventPayload);
    
    return { ...order, orden_items: items };
  }
}
