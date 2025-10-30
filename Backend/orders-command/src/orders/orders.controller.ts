import { Controller, Post, Body, HttpCode, HttpStatus, Patch, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmedOrderDto } from './dto/confirmed-order.dto';
import { Order } from './entities/order.entity';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
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
      ejemploOrden: {
        summary: 'Ejemplo de creación de orden',
        value: {
          usuarioId: 'user-123456',
          direccionEnvio: {
            nombreCompleto: "Juan Pérez",
            telefono: "+51 987654321", 
            direccionLinea1: "Calle Falsa 123",
            direccionLinea2: "Departamento 456",
            ciudad: "Lima",
            provincia: "Lima", 
            codigoPostal: "15001",
            pais: "Perú",
            referencia: "Frente al parque"
          },
          costos: {
            subtotal: 350.00,
            impuestos: 63.00,
            envio: 0.00,
            total: 413.00
          },
          entrega: {
            tipo: 'RECOJO_EN_TIENDA',
            tiendaId: 5,
            direccionEnvioId: 12
          },
          metodoPago: 'Tarjeta',
          items: [
            {
              productoId: 'prod-456',
              cantidad: 2,
              precioUnitario: 49.99,
              subTotal: 99.98,
              detalleProducto: {
                nombre: 'Zapatilla Nike',
                descripcion: 'Zapatilla running Nike edición 2025',
                marca: 'Nike',
                imagen: 'https://ejemplo.com/imagen1.jpg'
              }
            },
            {
              productoId: 'prod-789',
              cantidad: 1,
              precioUnitario: 89.99,
              subTotal: 89.99,
              detalleProducto: {
                nombre: 'Zapatilla Adidas',
                descripcion: 'Zapatilla fútbol Adidas edición limitada',
                marca: 'Adidas',
                imagen: 'https://ejemplo.com/imagen2.jpg'
              }
            }
          ]
        }
      }
    }
  })

  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return await this.ordersService.createOrder(createOrderDto);
  }

  @Patch(':id/confirmar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar orden (Admin)', description: 'Actualiza el estado de una orden a CONFIRMADO si está en estado PAGADO' })
  @ApiResponse({ status: 200, description: 'Orden confirmada exitosamente' })
  @ApiBadRequestResponse({ description: 'Orden ya confirmada o sin pago' })
  @ApiNotFoundResponse({description: 'Orden no encontrada: el ID proporcionado no corresponde a ninguna orden existente'})
  @ApiInternalServerErrorResponse({ description: 'Error inesperado del servidor' })
  async confirmarOrden(
    @Param('id') ordenId: string,
    @Body() dto: ConfirmedOrderDto
  ): Promise<void> {
    await this.ordersService.confirmarOrden(ordenId, dto.usuario);
  }

}
