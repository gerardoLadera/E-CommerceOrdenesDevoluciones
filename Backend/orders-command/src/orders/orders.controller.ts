import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse
} from '@nestjs/swagger';

@ApiTags('orders')
@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear una nueva orden',
    description: 'Endpoint para crear una orden desde el proceso de checkout. Crea la orden en la base de datos y emite un evento para otros servicios.'
  })
  @ApiCreatedResponse({
    description: 'Orden creada exitosamente',
    type: Order,
    headers: {
      'Location': {
        description: 'URL de la nueva orden',
        schema: { type: 'string' }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'customerId must be a string',
          'items should not be empty'
        ],
        error: 'Bad Request'
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor'
  })
  @ApiBody({
    type: CreateOrderDto,
    description: 'Datos requeridos para crear una orden desde el checkout',
    examples: {
      ejemploMinimo: {
        summary: 'Ejemplo mínimo (solo campos obligatorios)',
        value: {
          clienteId: 'user-123456',
          totalOrden: 149.97,
          moneda: 'PEN',
          metodoPago: 'Tarjeta',
          orden_items: [
            {
              productoId: 'prod-456',
              cantidad: 2,
              precioUnitario: 49.99,
              precioTotal: 99.98
            }
          ],
          direccion: 'Av. Principal 123, Lima'
        }
      },
      ejemploCompleto: {
        summary: 'Ejemplo completo (todos los campos posibles)',
        value: {
          clienteId: 'user-123456',
          totalOrden: 149.97,
          moneda: 'PEN',
          metodoPago: 'Tarjeta',
          direccionFacturacion: 'Calle Falsa 456, Lima, Perú',
          metadata: {
            descuento: 10,
            puntosUsados: 50
          },
          orden_items: [
            {
              productoId: 'prod-456',
              cantidad: 2,
              precioUnitario: 49.99,
              precioTotal: 99.98,
              detalleProducto: {
                size: 'M',
                color: 'red',
                material: 'polyester'
              }
            },
            {
              productoId: 'prod-789',
              cantidad: 1,
              precioUnitario: 89.99,
              precioTotal: 89.99,
              detalleProducto: {
                size: 'L',
                color: 'blue',
                sport: 'football'
              }
            }
          ],
          direccion: 'Av. Siempre Viva 123, Springfield, USA',
          notaEnvio: 'Entregar después de las 5pm'
        }
      }
    }
  })

  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return await this.ordersService.createOrder(createOrderDto);
  }
}
