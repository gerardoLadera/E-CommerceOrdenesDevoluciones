import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
    this.logger.log('Kafka client connected');
  }

  async emitOrderCreated(eventPayload: any) {
    this.logger.log('Enviando evento Kafka con payload:', eventPayload);
    await this.kafkaClient.emit('order-created', eventPayload);
    this.logger.log('Evento emitido a Kafka: order-created');
  }

  async emitOrderCancelled(eventPayload: any) {
    this.logger.log('Enviando evento Kafka con payload:', eventPayload);
    await this.kafkaClient.emit('order-cancelled', eventPayload);
    this.logger.log('Evento emitido a Kafka: order-cancelled');
  }
  
}
