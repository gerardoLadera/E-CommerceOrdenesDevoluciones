import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './kafka.consumer';
import { MongoModule } from '../mongo/mongo.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule, MongoModule],
  controllers: [KafkaConsumerService],
})
export class KafkaModule {}
