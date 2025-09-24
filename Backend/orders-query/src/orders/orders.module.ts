import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { OrderHistory } from './entities/orderHistory.entity';


@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderHistory])],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule {}
