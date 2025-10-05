import { Injectable } from '@nestjs/common';

@Injectable()
export class InventoryMockService {
  reserveStock(items: { sku: string; quantity: number }[]) {
    const noStockItem = items.find(i => i.quantity > 5);

    if (noStockItem) {
      return {
        status: 'NO_STOCK',
        sku: noStockItem.sku,
      };
    }

    return { status: 'OK' };
  }
}
