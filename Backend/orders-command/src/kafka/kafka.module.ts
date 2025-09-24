import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';



@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE', 
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['host.docker.internal:9092'],
          },
          consumer: {
            groupId: 'orders-command-producer', 
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
  ],
  exports: [ClientsModule], 
})
export class KafkaModule {}
