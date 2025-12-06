import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      process.env.FRONTEND_CLIENT_ORIGIN,
      process.env.FRONTEND_ADMIN_ORIGIN,
      'http://localhost:5173',
    ],
    methods: ['GET'],
    credentials: true
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Orders Query API')
    .setDescription(
      'Microservicio de consultas para órdenes (CQRS - E-Commerce)',
    )
    .setVersion('1.0')
    .addTag('orders', 'Endpoints de consulta de órdenes')
    .setContact('Equipo 2', '', 'carlos.montenegro4@unmsm.edu.pe')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'API Documentation - Orders Query Service',
    customCss: '.swagger-ui .topbar { display: none }',
    explorer: true,
  });

  // console.log('Swagger docs available at http://localhost:3002/api-docs');
  console.log('Swagger docs available at /api-docs');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      },
      consumer: {
        groupId: 'orders-query-consumer',
        allowAutoTopicCreation: true,
        fromBeginning: true,
        topics: [
          //'order-created',
          //'order-cancelled',
          //'order-paid',
          //'order-confirmed',
          //'order-processed',
          //'order-delivered',
          'return-created',
        ],
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT || 3002);
  console.log(
    `Orders Query Service running on port ${process.env.PORT || 3002}`,
  );
  console.log('Kafka consumer conectado y escuchando eventos...');
}
bootstrap();
