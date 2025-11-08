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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DevolucionService } from './devolucion.service';
import { CreateDevolucionDto } from './dto/create-devolucion.dto';
import { UpdateDevolucionDto } from './dto/update-devolucion.dto';
import { AprobarDevolucionDto } from './dto/aprobar-devolucion.dto';
import { RechazarDevolucionDto } from './dto/rechazar-devolucion.dto';
import { Devolucion } from './entities/devolucion.entity';

@ApiTags('Devoluciones')
@Controller('devolucion')
export class DevolucionController {
  constructor(private readonly devolucionService: DevolucionService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva solicitud de devolución' })
  @ApiResponse({
    status: 201,
    description: 'Devolución creada exitosamente',
    type: Devolucion,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  create(@Body() createDevolucionDto: CreateDevolucionDto) {
    return this.devolucionService.create(createDevolucionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las devoluciones' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todas las devoluciones',
    type: [Devolucion],
  })
  findAll() {
    return this.devolucionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una devolución por ID' })
  @ApiParam({ name: 'id', description: 'ID de la devolución' })
  @ApiResponse({
    status: 200,
    description: 'Devolución encontrada',
    type: Devolucion,
  })
  @ApiResponse({ status: 404, description: 'Devolución no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.devolucionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una devolución' })
  @ApiParam({ name: 'id', description: 'ID de la devolución' })
  @ApiResponse({
    status: 200,
    description: 'Devolución actualizada exitosamente',
    type: Devolucion,
  })
  @ApiResponse({ status: 404, description: 'Devolución no encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDevolucionDto: UpdateDevolucionDto,
  ) {
    return this.devolucionService.update(id, updateDevolucionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una devolución' })
  @ApiParam({ name: 'id', description: 'ID de la devolución' })
  @ApiResponse({ status: 204, description: 'Devolución eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Devolución no encontrada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.devolucionService.remove(id);
  }

  @Patch(':id/aprobar')
  @ApiOperation({
    summary: 'Aprobar una solicitud de devolución',
    description:
      'Aprueba una devolución pendiente, genera instrucciones de devolución y envía notificación al cliente',
  })
  @ApiParam({ name: 'id', description: 'ID de la devolución' })
  @ApiResponse({
    status: 200,
    description: 'Devolución aprobada exitosamente con instrucciones generadas',
    schema: {
      type: 'object',
      properties: {
        devolucion: { type: 'object' },
        instrucciones: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'La devolución no está en estado PENDIENTE' })
  @ApiResponse({ status: 404, description: 'Devolución no encontrada' })
  aprobar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() aprobarDto: AprobarDevolucionDto,
  ) {
    return this.devolucionService.aprobarDevolucion(id, aprobarDto);
  }

  @Patch(':id/rechazar')
  @ApiOperation({
    summary: 'Rechazar una solicitud de devolución',
    description: 'Rechaza una devolución pendiente y envía notificación al cliente con el motivo',
  })
  @ApiParam({ name: 'id', description: 'ID de la devolución' })
  @ApiResponse({
    status: 200,
    description: 'Devolución rechazada exitosamente',
    type: Devolucion,
  })
  @ApiResponse({ status: 400, description: 'La devolución no está en estado PENDIENTE' })
  @ApiResponse({ status: 404, description: 'Devolución no encontrada' })
  rechazar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() rechazarDto: RechazarDevolucionDto,
  ) {
    return this.devolucionService.rechazarDevolucion(id, rechazarDto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Marcar devolución como completada' })
  @ApiParam({ name: 'id', description: 'ID de la devolución' })
  @ApiResponse({
    status: 200,
    description: 'Devolución marcada como completada',
    type: Devolucion,
  })
  @ApiResponse({ status: 404, description: 'Devolución no encontrada' })
  markAsCompleted(@Param('id', ParseUUIDPipe) id: string) {
    return this.devolucionService.markAsCompleted(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar una devolución' })
  @ApiParam({ name: 'id', description: 'ID de la devolución' })
  @ApiResponse({
    status: 200,
    description: 'Devolución cancelada exitosamente',
    type: Devolucion,
  })
  @ApiResponse({ status: 404, description: 'Devolución no encontrada' })
  markAsCancelled(@Param('id', ParseUUIDPipe) id: string) {
    return this.devolucionService.markAsCancelled(id);
  }
}
