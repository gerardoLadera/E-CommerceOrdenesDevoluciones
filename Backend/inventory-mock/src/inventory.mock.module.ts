import { Module } from '@nestjs/common';
import { InventoryMockController } from './inventory.mock.controller';
import { InventoryMockService } from './inventory.mock.service';

@Module({
  controllers: [InventoryMockController],
  providers: [InventoryMockService],
})
export class InventoryMockModule {}
