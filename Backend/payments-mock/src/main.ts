import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Mock de Pagos')
    .setDescription('API simulada para procesamiento de pagos')
    .setVersion('1.0')
    .addTag('Pagos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  console.log('Swagger docs available at http://localhost:3006/api-docs');
  await app.listen(3006);
}
bootstrap();
