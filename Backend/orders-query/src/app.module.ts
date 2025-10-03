import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from './kafka/kafka.module';
import { OrdersModule } from './orders/orders.module';
import { MongoModule } from './mongo/mongo.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true,}),
    KafkaModule,
    OrdersModule,
    MongoModule
  ],
})
export class AppModule {}

