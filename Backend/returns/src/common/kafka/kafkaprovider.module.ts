import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from '@nestjs/common';
import { KafkaProducerService } from './kafkaprovider.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATIONS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'notifications',
              brokers: [configService.get<string>('KAFKA_BROKER') || 'kafka:9092'],
            },
            producer: {
              allowAutoTopicCreation: true,
            },
            consumer: {
              groupId: 'notifications-consumer',
            },
          },
        }),
      },
    ]),
  ],
  providers: [KafkaProducerService],
  exports: [KafkaProducerService],
})
export class KafkaproviderModule {}