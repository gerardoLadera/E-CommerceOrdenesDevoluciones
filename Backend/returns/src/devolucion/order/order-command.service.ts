import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// Interfaz interna simplificada para uso interno del servicio
interface InternalCreateOrderDto {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  metadata?: {
    originalOrderId?: string;
    returnId?: string;
    orderType: 'replacement' | 'new';
  };
}

// DTO que coincide con el formato de orders-command
export interface CreateOrderDto {
  usuarioId: string;
  direccionEnvio: {
    nombreCompleto: string;
    telefono: string;
    direccionLinea1: string;
    direccionLinea2?: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
    pais: string;
    referencia?: string;
  };
  costos: {
    subtotal: number;
    impuestos: number;
    envio: number;
    total: number;
  };
  entrega: {
    tipo: string;
    tiendaId?: number;
    direccionEnvioId?: number;
  };
  metodoPago: string;
  items: Array<{
    productoId: string;
    cantidad: number;
    precioUnitario: number;
    subTotal: number;
    detalleProducto: {
      nombre?: string;
      descripcion?: string;
      marca?: string;
      imagen?: string;
    };
  }>;
}

export interface CreateOrderResponse {
  id: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
}

@Injectable()
export class OrderCommandService {
  private readonly logger = new Logger(OrderCommandService.name);
  private readonly ordersCommandApiUrl =
    process.env.ORDERS_COMMAND_API_URL || 'http://localhost:3001';

  constructor(private readonly httpClient: HttpService) {}

  /**
   * Crear una orden de reemplazo en orders-command
   * Adapta los datos al formato esperado por el servicio de órdenes
   */
  async createReplacementOrder(
    customerId: string,
    items: Array<{ 
      productId: string; 
      quantity: number; 
      price: number;
      productDetails?: any;
    }>,
    originalOrderId: string,
    returnId: string,
    shippingAddress?: any,
  ): Promise<CreateOrderResponse> {
    try {
      // Calcular totales
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const impuestos = subtotal * 0.18; // 18% IGV para Perú
      const envio = 0; // Envío gratis para reemplazos
      const total = subtotal + impuestos + envio;

      // Adaptar items al formato de orders-command
      const orderItems = items.map(item => ({
        productoId: item.productId,
        cantidad: item.quantity,
        precioUnitario: item.price,
        subTotal: item.price * item.quantity,
        detalleProducto: {
          nombre: item.productDetails?.nombre || 'Producto de reemplazo',
          descripcion: item.productDetails?.descripcion || `Reemplazo de orden ${originalOrderId}`,
          marca: item.productDetails?.marca || 'N/A',
          imagen: item.productDetails?.imagen || '',
        },
      }));

      // Construir DTO según el formato de orders-command
      const createOrderDto: CreateOrderDto = {
        usuarioId: customerId,
        direccionEnvio: shippingAddress || {
          nombreCompleto: 'Cliente',
          telefono: 'N/A',
          direccionLinea1: 'Dirección de envío original',
          ciudad: 'Lima',
          provincia: 'Lima',
          codigoPostal: '15001',
          pais: 'Perú',
          referencia: `Orden de reemplazo para devolución ${returnId}`,
        },
        costos: {
          subtotal,
          impuestos,
          envio,
          total,
        },
        entrega: {
          tipo: 'ENVIO_DOMICILIO',
        },
        metodoPago: 'Reemplazo', // Método especial para órdenes de reemplazo
        items: orderItems,
      };

      const url = `${this.ordersCommandApiUrl}/orders`;
      this.logger.log(
        `Creating replacement order for customer ${customerId}, return ${returnId}`,
      );
      this.logger.debug('Order DTO:', JSON.stringify(createOrderDto, null, 2));

      const response = await firstValueFrom(
        this.httpClient.post<CreateOrderResponse>(url, createOrderDto),
      );

      this.logger.log(
        `Replacement order created successfully: ${response.data.id}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error creating replacement order: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Crear múltiples órdenes de reemplazo (si se requiere agrupar por algún criterio)
   */
  async createMultipleReplacementOrders(
    orders: Array<{
      customerId: string;
      items: Array<{ productId: string; quantity: number; price: number }>;
      originalOrderId: string;
      returnId: string;
      shippingAddress?: any;
    }>,
  ): Promise<CreateOrderResponse[]> {
    const results: CreateOrderResponse[] = [];

    for (const order of orders) {
      try {
        const result = await this.createReplacementOrder(
          order.customerId,
          order.items,
          order.originalOrderId,
          order.returnId,
          order.shippingAddress,
        );
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Failed to create replacement order for return ${order.returnId}`,
          error,
        );
        // Continuar con los demás o lanzar error según la lógica de negocio
      }
    }

    return results;
  }
}
