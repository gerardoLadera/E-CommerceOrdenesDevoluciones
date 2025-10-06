import { Body, Controller, Post } from '@nestjs/common';
import { InventoryMockService } from './inventory.mock.service';

@Controller('inventory')
export class InventoryMockController {
  constructor(private readonly inventoryMockService: InventoryMockService) {}

  @Post('reserve')
  reserve(@Body() body: { items: { productoId: string; cantidad: number }[] }) {
    return this.inventoryMockService.reserveStock(body.items);
  }
}
