import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Order } from './entities/Order';
import { OrderItem } from './entities/OrderItem';
import { OrderHistory } from './entities/OrderHistory';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT!, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [Order, OrderItem, OrderHistory],
      synchronize: true,
      ssl: false,
    }),
    TypeOrmModule.forFeature([Order, OrderItem, OrderHistory]), 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}