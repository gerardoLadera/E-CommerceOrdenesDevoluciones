import { Controller, Get, Param, Query } from '@nestjs/common';
import { OrdersService } from  './orders.service';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // GET /api/orders?userId=123&page=1&limit=10 para las ordenes del usuario
  @Get()
  async getOrders(
    @Query('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.ordersService.findAllByUser(userId, page, limit);
  }



  // GET /api/orders/:id   para  detalle de orden
  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.findOneById(id);
  }
}
