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

    async findAllByUser(clienteId: string, page: number = 1, limit: number = 10) {
    const [orders, total] = await this.ordersRepository.findAndCount({
      where: {clienteId},
      relations: ['items'], 
      skip: (page - 1) * limit,
      take: limit,
      order: { fechaCreacion: 'DESC' },
    });

    return {
      data: orders,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }


    async findOneById(clienteId: string) {
    const order = await this.ordersRepository.findOne({
      where: { clienteId },
      relations: ['items', 'history'], 
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${clienteId} no encontrada`);
    }

    return order;
  }
}

