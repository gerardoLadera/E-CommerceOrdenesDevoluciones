import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Controller } from '@nestjs/common';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/orderItem.entity';
import { OrderHistory } from '../orders/entities/orderHistory.entity';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()  
@Injectable()
export class KafkaConsumerService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepository: Repository<OrderItem>,
    @InjectRepository(OrderHistory)
    private readonly historyRepository: Repository<OrderHistory>,
  ) { console.log('KafkaConsumerService instanciado');}

@EventPattern('order-created') 
async handleOrderCreated(@Payload() payload: any) {
  console.log('Mensaje recibido por Kafka:', payload);
  const event = payload.data;

  const order = this.orderRepository.create({
    orden_id: event.orden_id,
    clienteId: event.clienteId,
    totalOrden: event.totalOrden,
    moneda: event.moneda,
    metadoPago: event.metodoPago,
    direccion: event.direccion,
    direccionFacturacion: event.direccionFacturacion ?? null,
    metadata: event.metadata ?? null,
    notaEnvio: event.notaEnvio ?? null,
    estado: event.estado,
    fechaCreacion: new Date(event.fechaCreacion),
    fechaActualizacion: new Date(event.fechaCreacion),
  });
  await this.orderRepository.save(order);

  if (event.orden_items?.length > 0) {
    const items = event.orden_items.map((item) =>
      this.itemRepository.create({
        orden_id: event.orden_id,
        productoId: item.producto_id,
        cantidad: item.cantidad,
        precioUnitario: item.precio_unitario,
        precioTotal: item.precio_total,
        detalleProducto: item.detalle_producto ?? null
      }),
    );
    await this.itemRepository.save(items);
  }

  const history = this.historyRepository.create({
    orden_id: event.orden_id,
    estadoAnterior: null,
    estadoNuevo: event.estado,
    fechaModificacion: new Date(event.fechaCreacion),
    modificadoPor: null,
    motivo: 'Orden replicada desde ORDEN_CREADA',
  });
  await this.historyRepository.save(history);

  console.log(`Orden ${event.id} replicada en order-query`);
}
}
