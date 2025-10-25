import { Injectable } from '@nestjs/common';

@Injectable()
export class InventoryMockService {
  async reserveStock(items: { productoId: string; cantidad: number }[]) {

    await new Promise(resolve => setTimeout(resolve, 3000)); 

    const productosSinStock = items.filter(i => i.cantidad > 5);

    if (productosSinStock.length > 0) {
      return {
        status: 'NO_STOCK',
        productosSinStock,
      };
    }

    return { status: 'OK' };
  }
}
