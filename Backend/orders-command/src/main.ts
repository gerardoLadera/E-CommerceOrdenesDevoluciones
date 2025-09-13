import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Orders Command API')
    .setDescription('API para gestión de comandos de órdenes')
    .setVersion('1.0')
    .addTag('orders')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['localhost:9092'], 
      },
      consumer: {
        groupId: 'orders-command-consumer', 
      },
    },
  });

  console.log('Swagger docs available at http://localhost:3001/api-docs');
  await app.startAllMicroservices();
  await app.listen(3001);
  console.log('Orders Command Service running on port 3001');
  console.log('Kafka microservice connected');
}
bootstrap();