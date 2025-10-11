import { Injectable} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

interface ReservaResponse {
  status: 'OK' | 'NO_STOCK';
  productosSinStock?: {
    productoId: string;
    cantidad: number;
  }[];
}

@Injectable()
export class InventoryService {
  constructor(private readonly httpService: HttpService) {}

  async reserveStock(items: { productoId: string; cantidad: number }[]) {
    const url = `${process.env.INVENTORY_SERVICE_URL|| 'http://localhost:3005'}/inventory/reserve`;
    const response = await firstValueFrom(this.httpService.post<ReservaResponse>(url, { items }));
    return response.data;
  }
}
