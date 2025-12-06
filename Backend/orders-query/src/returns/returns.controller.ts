import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Devoluciones Query')
@Controller('api/returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las devoluciones con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de devoluciones paginada',
  })
  async getAllReturns(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.returnsService.findAll(+page, +limit);
  }

  @Get('estado/:estado')
  @ApiOperation({ summary: 'Obtener devoluciones por estado' })
  @ApiParam({ name: 'estado', description: 'Estado de la devolución' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de devoluciones filtradas por estado',
  })
  async getReturnsByEstado(
    @Param('estado') estado: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.returnsService.findByEstado(estado, +page, +limit);
  }

  @Get('orden/:ordenId')
  @ApiOperation({ summary: 'Obtener devoluciones por ID de orden' })
  @ApiParam({ name: 'ordenId', description: 'ID de la orden' })
  @ApiResponse({
    status: 200,
    description: 'Lista de devoluciones de una orden específica',
  })
  async getReturnsByOrderId(@Param('ordenId') ordenId: string) {
    return this.returnsService.findByOrderId(ordenId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una devolución por ID' })
  @ApiParam({ name: 'id', description: 'ID de la devolución' })
  @ApiResponse({
    status: 200,
    description: 'Detalle completo de la devolución',
  })
  @ApiResponse({
    status: 404,
    description: 'Devolución no encontrada',
  })
  async getReturnById(@Param('id') id: string) {
    return this.returnsService.findOneById(id);
  }
}
