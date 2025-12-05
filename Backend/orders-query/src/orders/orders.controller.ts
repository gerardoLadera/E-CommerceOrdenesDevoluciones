import { Controller, Get, Param, Query } from '@nestjs/common';
import { OrdersService } from  './orders.service';
import { ApiResponse,ApiParam } from '@nestjs/swagger';
import { OrderSummaryDto } from './dto/order-summary.dto';
import { OrderDetailDto } from './dto/order-detail.dto';
import { OrderAdminSummaryDto } from './dto/order-admin';
import { GetAllOrdersQueryDto } from './dto/filters.dto';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // GET /api/orders/usuario/:usuarioId&123&page=1&limit=10
  @Get('usuario/:usuarioId')
  @ApiResponse({
  status: 200,
  description: 'Lista de órdenes del usuario con vista preliminar',
  type: [OrderSummaryDto]
})
  async getOrders(
    @Param('usuarioId') usuarioId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
    @Query('filter') filter: string = 'todos',
    @Query('search') search: string = '',
  ) {
    return this.ordersService.findAllByUser(usuarioId, page, limit, filter, search);
  }



  // GET /api/orders/:id   para  detalle de orden
  @Get(':id')
  @ApiParam({ name: 'id', description: 'ID de la orden' })
  @ApiResponse({
  status: 200,
  description: 'Detalle completo de una orden',
  type: OrderDetailDto,
})
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.findOneById(id);
  }


  // GET /api/orders?page=1&limit=9
  @Get()
  @ApiResponse({
    status: 200,
    description: 'Lista general de todas las órdenes con vista preliminar',
    type: [OrderAdminSummaryDto],
  })
    async getAllOrders(@Query() query: GetAllOrdersQueryDto) {
    return this.ordersService.findAll({
      ...query,
      tieneDevolucion: query.tiene_devolucion,
    });
  }


  }
  // async getAllOrders(
  //   @Query('page') page: number = 1,
  //   @Query('limit') limit: number = 9,
  //   @Query('busquedaId') busquedaId?: string,
  //   @Query('busquedaCliente') busquedaCliente?: string,
  //   @Query('estado') estado?: string,
  //   @Query('tiene_devolucion') tieneDevolucion?: string,
  //   @Query('fechaInicio') fechaInicio?: string,
  //   @Query('fechaFin') fechaFin?: string,
  // ) {
  //   return this.ordersService.findAll({
  //     page,
  //     limit,
  //     busquedaId,
  //     busquedaCliente,
  //     estado,
  //     tieneDevolucion,
  //     fechaInicio,
  //     fechaFin,
  //   });
  // }


