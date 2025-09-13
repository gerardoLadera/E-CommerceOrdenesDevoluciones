import { Controller, Post, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('orders')
@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva orden' })
  @ApiResponse({ 
    status: 201, 
    description: 'Orden creada exitosamente',
    type: Order
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos de entrada inválidos' 
  })
  @ApiBody({
    type: CreateOrderDto,
    description: 'Datos necesarios para crear una orden',
    examples: {
      example1: {
        summary: 'Ejemplo de orden',
        value: {
          customerId: "user-123",
          items: [
            { productId: "prod-456", quantity: 2 }
          ],
          shippingAddress: "Av. Siempre Viva 123, Springfield"
        }
      }
    }
  })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return await this.ordersService.createOrder(createOrderDto);
  }
}
