import { Controller, Get, Param, Query } from '@nestjs/common';
import { OrdersService } from  './orders.service';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // GET /api/orders?clientId=123&page=1&limit=10
  @Get()
  async getOrders(
    @Query('clientId') clientId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.ordersService.findAllByUser(clientId, page, limit);
  }



  // GET /api/orders/:id   para  detalle de orden
  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.findOneById(id);
  }
}
