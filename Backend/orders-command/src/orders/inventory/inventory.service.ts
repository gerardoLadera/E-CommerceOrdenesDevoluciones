import { Injectable} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

// interface ReservaResponse {
//   status: 'OK' | 'NO_STOCK';
//   productosSinStock?: {
//     productoId: string;
//     cantidad: number;
//   }[];
//   ordenId: string;
// }


interface ReservaResponse {
  message: string;
  id_orden: number;
  tipo_envio: string;
  id_tienda?: number | null;
  id_carrier?: number | null;
  total_productos: number;
  fecha_expiracion: string;
  reservas: any[];
}

export interface ReservaPayload {
  id_orden: string | number;
  productos: {
    id_producto: number;
    cantidad: number;
  }[];
  tipo_envio: 'RECOJO_TIENDA' | 'DOMICILIO';
  id_tienda?: number;
  id_carrier?: number;
  direccion_envio?: string;
  latitud_destino?: number;
  longitud_destino?: number;
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

  async reserveStock(payload: ReservaPayload): Promise<ReservaResponse> {
    const url = `${process.env.INVENTORY_SERVICE_MODULO|| 'http://localhost:3005'}/api/reservas/from-order`;
    try {
      const response = await firstValueFrom(this.httpService.post<ReservaResponse>(url, payload));
      return response.data;
    } catch (error:any) {
      // Si el servicio devuelve 400 (No stock)
      const errorMsg =
        error.response?.data?.error || 
        error.message ||               
        'Error al reservar stock';

      // Lanzamos un Error 
      throw new Error(errorMsg);
    }
  }

  async descontarStock(payload: {
    ordenId: string;
    items: { productoId: number; cantidad: number }[];
  }) {
    const url = `${process.env.INVENTORY_SERVICE_URL|| 'http://localhost:3005'}/api/reservas/descontar`; 
    const response = await firstValueFrom(this.httpService.post<DescuentoResponse>(url, payload));
    return response.data;
  }




}
