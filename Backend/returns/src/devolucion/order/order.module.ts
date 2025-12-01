import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OrderService } from './order.service';
import { OrderCommandService } from './order-command.service';

@Module({
    imports: [HttpModule], 
    providers: [OrderService, OrderCommandService],
    exports: [OrderService, OrderCommandService], 
})
export class OrdersModule {}