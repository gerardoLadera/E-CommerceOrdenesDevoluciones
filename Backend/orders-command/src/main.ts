import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.KAFKA,
  //   options: {
  //     client: {
  //       brokers: ['localhost:9092'], 
  //     },
  //     consumer: {
  //       groupId: 'orders-command-consumer', 
  //     },
  //   },
  // });

  await app.startAllMicroservices();
  
  await app.listen(3001); 
}
bootstrap();