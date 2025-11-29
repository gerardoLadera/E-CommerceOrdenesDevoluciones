import { Injectable } from '@nestjs/common';

@Injectable()
export class InventoryMockService {
  async reserveStock(payload: {
    id_orden: number;
    productos: { id_producto: number; cantidad: number }[];
    tipo_envio: 'RECOJO_TIENDA' | 'DOMICILIO';
    id_tienda?: number;
    id_carrier?: number;
    direccion_envio?: string;
    latitud_destino?: number;
    longitud_destino?: number;
  }) {
    // Simula un pequeño delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const fechaReserva = new Date().toISOString();
    const fechaExpiracion = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // +1 día

    return {
      message: 'Reservas creadas exitosamente',
      id_orden: payload.id_orden,
      tipo_envio: payload.tipo_envio,
      id_tienda: payload.tipo_envio === 'RECOJO_TIENDA' ? payload.id_tienda ?? null : null,
      id_carrier: payload.tipo_envio === 'DOMICILIO' ? payload.id_carrier ?? null : null,
      total_productos: payload.productos.reduce((acc, p) => acc + p.cantidad, 0),
      fecha_expiracion: fechaExpiracion,
      reservas: payload.productos.map((p, index) => ({
        id: index + 1,
        id_stock_producto: p.id_producto,
        id_orden: payload.id_orden,
        stock_reservado: p.cantidad,
        fecha_reserva: fechaReserva,
        fecha_expiracion: fechaExpiracion,
        id_estado: 1,
        tipo_envio: payload.tipo_envio,
        id_tienda: payload.tipo_envio === 'RECOJO_TIENDA' ? payload.id_tienda ?? null : null,
        id_carrier: payload.tipo_envio === 'DOMICILIO' ? payload.id_carrier ?? null : null,
        direccion_envio: payload.direccion_envio ?? null,
        latitud_destino: payload.latitud_destino ?? null,
        longitud_destino: payload.longitud_destino ?? null,
        estado: {
          id: 1,
          nombre: 'PENDING',
        },
      })),
    };
  }

  async descontarStock(ordenId: number, items: { productoId: number; cantidad: number }[]) {
    console.log('Descontando stock para orden:', ordenId);
    console.log('Items recibidos:', items);

    await new Promise(resolve => setTimeout(resolve, 500)); 

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
