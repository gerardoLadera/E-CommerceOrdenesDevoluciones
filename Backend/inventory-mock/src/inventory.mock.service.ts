import { Injectable } from '@nestjs/common';

@Injectable()
export class InventoryMockService {
  async reserveStock(ordenId: string, items: { productoId: string; cantidad: number }[]) {

    await new Promise(resolve => setTimeout(resolve, 3000)); 

    const productosSinStock = items.filter(i => i.cantidad > 5);

    if (productosSinStock.length > 0) {
      return {
        status: 'NO_STOCK',
        productosSinStock,
        ordenId,
      };
    }

    return { status: 'OK', ordenId};
  }

  async descontarStock(ordenId: string, items: { productoId: string; cantidad: number }[]) {
    console.log('Descontando stock para orden:', ordenId);
    console.log('Items recibidos:', items);

    await new Promise(resolve => setTimeout(resolve, 2000)); 

    // Simulación: si algún producto tiene cantidad negativa, lo tratamos como error
    const productosInvalidos = items.filter(i => i.cantidad <= 0);

    if (productosInvalidos.length > 0) {
      return {
        status: 'ERROR',
        mensaje: 'Cantidad inválida en uno o más productos',
        productosInvalidos,
        ordenId,
      };
    }

    return {
      status: 'STOCK_DESCONTADO',
      ordenId,
      productosProcesados: items.length,
    };
  }

}
