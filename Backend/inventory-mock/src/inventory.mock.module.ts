import { Module } from '@nestjs/common';
import { InventoryMockController } from './inventory.mock.controller';
import { InventoryMockService } from './inventory.mock.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.development.local',
      isGlobal: true,
    }),
  ],
  controllers: [InventoryMockController],
  providers: [InventoryMockService],
})
export class InventoryMockModule {}
