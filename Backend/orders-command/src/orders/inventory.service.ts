import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class InventoryService {
  private readonly INVENTORY_URL = 'http://localhost:4000/inventory/reserve'; 
  async reserveStock(items: { sku: string; quantity: number }[]) {
    try {
      const response = await axios.post(this.INVENTORY_URL, { items });
      return response.data; // {status: 'OK'} o {status: 'NO_STOCK', sku: 'X'}
    } catch (err) {
      throw new HttpException('Error al conectar con Inventory', HttpStatus.BAD_GATEWAY);
    }
  }
}
