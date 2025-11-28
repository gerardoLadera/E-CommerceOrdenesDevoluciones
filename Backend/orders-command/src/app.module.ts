import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/orderItem.entity';
import { OrderHistory } from './orders/entities/orderHistory.entity';
import { OrdersModule } from './orders/orders.module';
import { Pago } from './orders/entities/pago.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.development.local',
      isGlobal: true,
    }),
    ...(process.env.NODE_ENV === 'test'
    ? []
    : [  
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: Number.parseInt(process.env.DB_PORT!, 10),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD?.toString(),
          database: process.env.DB_DATABASE,
          entities: [Order, OrderItem, OrderHistory,Pago],
          synchronize: true,
          ssl: false,
        }),
      ]),
    OrdersModule, 
  ],
})
export class AppModule {}