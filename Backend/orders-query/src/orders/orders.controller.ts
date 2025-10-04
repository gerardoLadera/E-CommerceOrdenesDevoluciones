import { Controller, Get, Param, Query } from '@nestjs/common';
import { OrdersService } from  './orders.service';
import { ApiResponse } from '@nestjs/swagger';
import { OrderSummaryDto } from './dto/order-summary.dto';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // GET /api/orders?usuarioId=123&page=1&limit=10
  @Get()
  @ApiResponse({
  status: 200,
  description: 'Lista de órdenes del usuario con vista preliminar',
  type: [OrderSummaryDto]
})
  async getOrders(
    @Query('usuarioId') usuarioId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.ordersService.findAllByUser(usuarioId, page, limit);
  }



  // GET /api/orders/:id   para  detalle de orden
  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.findOneById(id);
  }
}
