import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './kafka.consumer';
import { MongoModule } from '../mongo/mongo.module';


@Module({
  imports: [MongoModule],
  controllers: [KafkaConsumerService],
})
export class KafkaModule {}
