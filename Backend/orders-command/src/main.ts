import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Elimina propiedades no incluidas en el DTO
    forbidNonWhitelisted: true, // Lanza error si hay propiedades no permitidas
    transform: true, // Transforma tipos automáticamente
  }));

  const config = new DocumentBuilder()
    .setTitle('Orders Command API')
    .setDescription('Sistema de gestión de órdenes y devoluciones - E-Commerce Deportivo')
    .setVersion('1.0')
    .addTag('orders', 'Operaciones relacionadas con órdenes')
    .addTag('returns', 'Operaciones relacionadas con devoluciones')
    .setContact('Equipo 2', '', 'carlos.montenegro4@unmsm.edu.pe')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'API Documentation - Orders Service',
    customCss: '.swagger-ui .topbar { display: none }',
    explorer: true, // Permitir búsqueda en la documentación
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'], 
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