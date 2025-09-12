import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {

    //Almacenamiento de ordenes temporal 
  private orders: Order[] = [];

  // Método para crear una orden  a partir de CreateOrderDto
  createOrder(createOrderDto: CreateOrderDto): Order {
    const order = new Order({
      id: uuidv4(),
      customerId: createOrderDto.customerId,
      items: createOrderDto.items,
      shippingAddress: createOrderDto.shippingAddress,
      status: 'CREATED',
      createdAt: new Date(),
    });

    this.orders.push(order);



    return order;
  }

}
