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
    description: 'Datos requeridos para crear una orden',
    examples: {
      minimal: {
        summary: 'Ejemplo mínimo',
        value: {
          customerId: "user-123",
          items: [{ productId: "prod-456", quantity: 2 }],
          shippingAddress: "Av. Principal 123"
        }
      },
      complete: {
        summary: 'Ejemplo completo',
        value: {
          customerId: "user-123",
          items: [
            { productId: "prod-456", quantity: 2 },
            { productId: "prod-789", quantity: 1 }
          ],
          shippingAddress: "Av. Siempre Viva 123, Springfield",
          notes: "Entregar después de las 5pm"
        }
      }
    }
  })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return await this.ordersService.createOrder(createOrderDto);
  }
}
