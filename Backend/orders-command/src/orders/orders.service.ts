import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { OrderHistory } from './entities/orderHistory.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(OrderHistory)
    private readonly orderHistoryRepository: Repository<OrderHistory>,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    // Crear orden
    const order = this.orderRepository.create({
      id: uuidv4(),
      user_id: createOrderDto.customerId,
      status: 'CREATED',
      total_amount: 0,
      currency: 'USD',
      shipping_address: createOrderDto.shippingAddress,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.orderRepository.save(order);

    // Crear items
    const items = createOrderDto.items.map((i) =>
      this.orderItemRepository.create({
        order_id: order.id,
        sku_id: i.productId,
        quantity: i.quantity,
        unit_price: 0,
        total_price: 0,
      }),
    );

    await this.orderItemRepository.save(items);

    // Guardar historial de creación
    const history = this.orderHistoryRepository.create({
        order_id: order.id,
        previous_status: null,
        new_status: 'CREATED',
        changed_at: new Date(),
    });

    await this.orderHistoryRepository.save(history);

    // Retornar la orden con sus items
    return { ...order, order_items: items };
  }
}
