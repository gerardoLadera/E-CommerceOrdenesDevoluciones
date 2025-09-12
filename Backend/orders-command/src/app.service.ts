import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/Order';
import { OrderItem } from './entities/OrderItem';
import { OrderHistory } from './entities/OrderHistory';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderHistory)
    private orderHistoryRepository: Repository<OrderHistory>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }
}