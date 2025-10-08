import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { OrderHistory } from './entities/orderHistory.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { HttpModule } from '@nestjs/axios';
import { InventoryService } from './inventory/inventory.service';
import { Pago } from './entities/pago.entity';


@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, OrderHistory,Pago]),
        KafkaModule,
        HttpModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService,InventoryService],
})
export class OrdersModule {}