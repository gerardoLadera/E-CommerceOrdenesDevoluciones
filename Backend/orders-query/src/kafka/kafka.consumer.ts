import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/orderItem.entity';
import { OrderHistory } from '../orders/entities/orderHistory.entity';
import { MessagePattern, Payload } from '@nestjs/microservices';

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

@MessagePattern('order-created') 
async handleOrderCreated(@Payload() message: any) {
  console.log('Mensaje recibido por Kafka:', message);
  const event = message.value.data;

  const order = this.orderRepository.create({
    id: event.id,
    user_id: event.user_id,
    total_amount: event.total_amount,
    currency: event.currency,
    status: event.status,
    created_at: event.created_at,
    updated_at: event.updated_at,
    shipping_address: event.shipping_address,
    billing_address_id: event.billing_address_id,
    payment_id: event.payment_id,
    metadata: event.metadata,
  });
  await this.orderRepository.save(order);

  if (event.items?.length > 0) {
    const items = event.items.map((item) =>
      this.itemRepository.create({
        order_id: event.id,
        sku_id: item.sku_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        attributes: item.attributes,
      }),
    );
    await this.itemRepository.save(items);
  }

  const history = this.historyRepository.create({
    order_id: event.id,
    previous_status: null,
    new_status: event.status,
    changed_by: event.user_id,
    changed_at: new Date(),
    reason: 'Orden creada',
  });
  await this.historyRepository.save(history);

  console.log(`Orden ${event.id} replicada en order-query`);
}
}
