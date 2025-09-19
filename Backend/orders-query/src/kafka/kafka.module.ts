import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './kafka.consumer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/orderItem.entity';
import { OrderHistory } from '../orders/entities/orderHistory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderHistory])],
  providers: [KafkaConsumerService],
})
export class KafkaModule {}
