import { NestFactory } from '@nestjs/core';
import { InventoryMockModule } from './inventory.mock.module';

async function bootstrap() {
  const app = await NestFactory.create(InventoryMockModule);
  await app.listen(process.env.PORT || 3005); 
}
bootstrap();
