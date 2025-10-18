import { ClientKafka } from '@nestjs/microservices';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
    private readonly logger = new Logger(KafkaProducerService.name);
  constructor(
    @Inject('NOTIFICATIONS_SERVICE') private readonly client: ClientKafka,
  ) {}

  async onModuleInit() {
    // 👇 Asegura que el cliente se conecte antes de emitir eventos
    await this.client.connect();
    this.logger.log('Kafka Producer connected successfully');
  }

  async emitReturnCreated(eventPayload: any) {
    this.logger.log('Enviando evento Kafka con payload:', eventPayload);
    await this.client.emit('return-created', eventPayload);
    this.logger.log('Evento emitido a Kafka: return-created');
  }
  async emitReturnCancelled(eventPayload: any) {
    this.logger.log('Enviando evento Kafka con payload:', eventPayload);
    await this.client.emit('return-cancelled', eventPayload);
    this.logger.log('Evento emitido a Kafka: return-cancelled');
  }

  async returnPaid(eventPayload: any) {
    this.logger.log('Enviando evento Kafka con payload:', eventPayload);
    await this.client.emit('return-paid', eventPayload);
    this.logger.log('Evento emitido a Kafka: return-paid');
  }
}
