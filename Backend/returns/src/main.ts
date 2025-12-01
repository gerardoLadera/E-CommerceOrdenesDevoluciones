import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const port = process.env.PORT || 3000;
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log'],
  });
  app.enableCors({
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Returns Service')
    .setDescription('API for managing returns')
    .setVersion('1.0')
    .addTag('returns')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'API Documentation - Returns Service',
    customCss: '.swagger-ui .topbar { display: none }',
    explorer: true,
  });

  logger.log('Swagger UI is available at http://localhost:3003/api-docs');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'returns-service',
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      },
      consumer: {
        groupId: 'returns-consumer',
      },
    },
  });
  logger.log('Kafka microservice connected');

  await app.startAllMicroservices();
  logger.log('All microservices started');

  await app.listen(port);
  logger.log('Returns Service is running on port 3003');
}
bootstrap();
