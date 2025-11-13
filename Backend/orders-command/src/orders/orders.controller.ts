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
    ejemploRecojoTienda: {
      summary: 'Ejemplo de creación de orden con recojo en tienda',
      value: {
        usuarioId: 123,
        direccionEnvio: {
          nombreCompleto: "Juan Pérez",
          telefono: "+51 987654321",
          direccionLinea1: "Av. Siempre Viva 742",
          direccionLinea2: "Depto 301",
          ciudad: "Lima",
          provincia: "Lima",
          codigoPostal: "15001",
          pais: "Perú"
        },
        items: [
          {
            productoId: 1,
            nombreProducto: "Camiseta Azul",
            cantidad: 2,
            precioUnitario: 50.0,
            subTotal: 100.0
          },
          {
            productoId: 2,
            nombreProducto: "Zapatillas Running",
            cantidad: 1,
            precioUnitario: 250.0,
            subTotal: 250.0
          }
        ],
        costos: {
          subtotal: 350.0,
          impuestos: 63.0,
          envio: 0.0,
          total: 413.0
        },
        entrega: {
          tipo: "RECOJO_TIENDA",
          almacenOrigen: {
            id: 2,
            nombre: "Almacén Cusco",
            direccion: "Av. El Sol 456 - Almacén Cusco",
            latitud: -13.5319,
            longitud: -71.9675
          },
          tiendaSeleccionada: {
            id: 5,
            nombre: "Tienda Surco Mall",
            direccion: "Av. Primavera 890 - Tienda Sur",
            latitud: -12.145,
            longitud: -77.01,
            distancia_km: 11.53
          },
          costoEnvio: 0.0,
          tiempoEstimadoDias: 0,
          fechaEntregaEstimada: "2025-11-08T08:00:18.931Z",
          descripcion: "Recoge tu pedido en tienda sin costo adicional"
        },
        metodoPago: "SIMULADO",
        estadoInicial: "PENDIENTE"
      }
    },
    ejemploDomicilio: {
      summary: 'Ejemplo de creación de orden con envío a domicilio',
      value: {
        usuarioId: 123,
        direccionEnvio: {
          nombreCompleto: "Juan Pérez",
          telefono: "+51 987654321",
          direccionLinea1: "Av. Siempre Viva 742",
          direccionLinea2: "Depto 301",
          ciudad: "Lima",
          provincia: "Lima",
          codigoPostal: "15001",
          pais: "Perú"
        },
        items: [
          {
            productoId: 1,
            nombreProducto: "Camiseta Azul",
            cantidad: 2,
            precioUnitario: 50.0,
            subTotal: 100.0
          },
          {
            productoId: 2,
            nombreProducto: "Zapatillas Running",
            cantidad: 1,
            precioUnitario: 250.0,
            subTotal: 250.0
          }
        ],
        costos: {
          subtotal: 350.0,
          impuestos: 63.0,
          envio: 119.69,
          total: 532.69
        },
        entrega: {
          tipo: "DOMICILIO",
          almacenOrigen: {
            id: 2,
            nombre: "Almacén Cusco",
            direccion: "Av. El Sol 456 - Almacén Cusco",
            latitud: -13.5319,
            longitud: -71.9675
          },
          carrierSeleccionado: {
            carrier_id: 1,
            carrier_nombre: "FedEx Express",
            carrier_codigo: "FEDEX",
            costo_envio: 119.69,
            tiempo_estimado_dias: 8,
            fecha_entrega_estimada: "2025-11-16T08:00:18.976Z",
            cotizacion_id: "cmhpzvgv7000jlc016qi9jueu"
          },
          direccionEnvioId: 12
        },
        metodoPago: "SIMULADO",
        estadoInicial: "PENDIENTE"
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
