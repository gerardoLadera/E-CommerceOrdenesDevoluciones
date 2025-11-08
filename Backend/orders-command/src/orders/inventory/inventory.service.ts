import { Injectable} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

interface ReservaResponse {
  status: 'OK' | 'NO_STOCK';
  productosSinStock?: {
    productoId: string;
    cantidad: number;
  }[];
  ordenId: string;
}

interface DescuentoResponse {
  status: 'STOCK_DESCONTADO' | 'ERROR';
  ordenId: string;
  productosProcesados?: number;
  mensaje?: string;
  productosInvalidos?: {
    productoId: string;
    cantidad: number;
  }[];
}

@Injectable()
export class InventoryService {
  constructor(private readonly httpService: HttpService) {}

  async reserveStock(ordenId: string, items: { productoId: string; cantidad: number }[]): Promise<ReservaResponse> {
    const url = `${process.env.INVENTORY_SERVICE_URL|| 'http://localhost:3005'}/inventory/reserve`;
    const response = await firstValueFrom(this.httpService.post<ReservaResponse>(url, { ordenId,items }));
    return response.data;
  }

  async descontarStock(payload: {
    ordenId: string;
    items: { productoId: string; cantidad: number }[];
  }) {
    const url = `${process.env.INVENTORY_SERVICE_URL}/inventory/descontar`; 
    const response = await firstValueFrom(this.httpService.post<DescuentoResponse>(url, payload));
    return response.data;
  }




}
