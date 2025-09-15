import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { OrderHistory } from './entities/orderHistory.entity';
import { InventoryService } from './inventory.service';


@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderHistory])],
    controllers: [OrdersController],
    providers: [OrdersService, InventoryService],
})
export class OrdersModule {}