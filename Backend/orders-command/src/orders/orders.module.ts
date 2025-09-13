import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { OrderHistory } from './entities/orderHistory.entity';
import { KafkaModule } from '../kafka/kafka.module';


@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, OrderHistory]),
        KafkaModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule {}