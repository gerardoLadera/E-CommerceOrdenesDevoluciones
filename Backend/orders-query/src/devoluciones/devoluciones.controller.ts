import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { DevolucionesService } from './devoluciones.service';

@ApiTags('devoluciones')
@Controller('api/devolucion')
export class DevolucionesController {
  constructor(private readonly devolucionesService: DevolucionesService) {}

  // GET /api/devolucion      → obtener lista
  @Get()
  @ApiResponse({
    status: 200,
    description:
      'Lista de todas las devoluciones con vista preliminar (para el admin).',
    type: Object,
  })
  async findAll() {
    return this.devolucionesService.findAll();
  }

  // GET /api/devolucion/:id  → obtener devolución por ID
  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'ID de la devolución a consultar',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Detalles completos de una devolución específica.',
  })
  @ApiResponse({
    status: 404,
    description: 'Devolución no encontrada.',
  })
  async findOne(@Param('id') id: string) {
    const result = await this.devolucionesService.findOne(id);

    if (!result) {
      throw new NotFoundException(`Devolución con ID ${id} no encontrada`);
    }

    return result;
  }
}
