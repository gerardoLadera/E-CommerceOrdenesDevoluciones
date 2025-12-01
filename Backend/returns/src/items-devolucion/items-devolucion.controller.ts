import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ItemsDevolucionService } from './items-devolucion.service';
import { CreateItemsDevolucionDto } from './dto/create-items-devolucion.dto';
import { CreateMultipleItemsDevolucionDto } from './dto/create-multiple-items-devolucion.dto';
import { UpdateItemsDevolucionDto } from './dto/update-items-devolucion.dto';
import { ItemDevolucion } from './entities/items-devolucion.entity';

@ApiTags('Items de Devolución')
@Controller('items-devolucion')
export class ItemsDevolucionController {
  constructor(
    private readonly itemsDevolucionService: ItemsDevolucionService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo item de devolución',
    description:
      'Registra un producto específico dentro de una devolución, incluyendo cantidad, precio y acción solicitada.',
  })
  @ApiBody({
    type: CreateItemsDevolucionDto,
    description: 'Datos del item a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Item de devolución creado exitosamente',
    type: ItemDevolucion,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  create(@Body() createItemsDevolucionDto: CreateItemsDevolucionDto) {
    return this.itemsDevolucionService.create(createItemsDevolucionDto);
  }

  @Post('multiple')
  @ApiOperation({
    summary: 'Crear múltiples items para una devolución',
    description:
      'Permite asignar varios productos a una devolución en una sola operación. Ideal para devoluciones con múltiples artículos.',
  })
  @ApiBody({
    type: CreateMultipleItemsDevolucionDto,
    description: 'Datos de la devolución y array de items a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Items de devolución creados exitosamente',
    type: [ItemDevolucion],
    isArray: true,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o devolución no encontrada',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  createMultiple(@Body() createMultipleDto: CreateMultipleItemsDevolucionDto) {
    return this.itemsDevolucionService.createMultiple(createMultipleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los items de devolución',
    description: 'Retorna una lista completa de todos los items de devolución registrados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de items de devolución',
    type: [ItemDevolucion],
    isArray: true,
  })
  findAll() {
    return this.itemsDevolucionService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un item de devolución por ID',
    description: 'Retorna los detalles de un item específico de devolución.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del item de devolución',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Item de devolución encontrado',
    type: ItemDevolucion,
  })
  @ApiResponse({
    status: 404,
    description: 'Item de devolución no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Item de devolución 550e8400-e29b-41d4-a716-446655440000 not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemsDevolucionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un item de devolución',
    description: 'Actualiza parcialmente los datos de un item de devolución existente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del item de devolución a actualizar',
    type: String,
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateItemsDevolucionDto,
    description: 'Campos a actualizar (todos opcionales)',
  })
  @ApiResponse({
    status: 200,
    description: 'Item de devolución actualizado exitosamente',
    type: ItemDevolucion,
  })
  @ApiResponse({
    status: 404,
    description: 'Item de devolución no encontrado',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItemsDevolucionDto: UpdateItemsDevolucionDto,
  ) {
    return this.itemsDevolucionService.update(id, updateItemsDevolucionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un item de devolución',
    description: 'Elimina permanentemente un item de devolución del sistema.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del item de devolución a eliminar',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Item de devolución eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Item de devolución no encontrado',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemsDevolucionService.remove(id);
  }
}
