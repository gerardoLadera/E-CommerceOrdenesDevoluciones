import { Body, Controller, Post } from '@nestjs/common';
import { InventoryMockService } from './inventory.mock.service';

@Controller('api/reservas')
export class InventoryMockController {
  constructor(private readonly inventoryMockService: InventoryMockService) {}

  @Post('from-order')
  reserve(@Body() body: {
    id_orden: number;
    productos: { id_producto: number; cantidad: number }[];
    tipo_envio: 'RECOJO_TIENDA' | 'DOMICILIO';
    id_tienda?: number;
    id_carrier?: number;
    direccion_envio?: string;
    latitud_destino?: number;
    longitud_destino?: number;
  }) {
    return this.inventoryMockService.reserveStock(body);
  }

  @Post('descontar')
  descontar(@Body() body: { ordenId: number; items: { productoId: number; cantidad: number }[] }) {
    return this.inventoryMockService.descontarStock(body.ordenId, body.items);
  }
}

  





