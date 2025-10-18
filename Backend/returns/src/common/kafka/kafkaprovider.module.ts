import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from '@nestjs/common';
import { KafkaProducerService } from './kafkaprovider.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'notifications',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          producer: {
            allowAutoTopicCreation: true,
          },
          consumer: {
            groupId: 'notifications-consumer',
          },

        },
      },
    ]),
  ],
  providers: [KafkaProducerService],
  exports: [KafkaProducerService],
})
export class KafkaproviderModule {}