import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
  ) {}

    async findAllByUser(userId: string, page: number = 1, limit: number = 10) {
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { userId },
      relations: ['items'], 
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: orders,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }


    async findOneById(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'history'], 
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }

    return order;
  }
}

