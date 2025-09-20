import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private producer: Producer;

  async onModuleInit() {
    const kafka = new Kafka({
      clientId: 'orders-command-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });

    this.producer = kafka.producer();
    await this.producer.connect();
    console.log('Kafka Producer connected successfully');
  }

  async emitEvent(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.id || Date.now().toString(),
            value: JSON.stringify(message),
          },
        ],
      });
      console.log(`Event emitted to ${topic}:`, message);
    } catch (error) {
      console.error('Error emitting event to Kafka:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }
}