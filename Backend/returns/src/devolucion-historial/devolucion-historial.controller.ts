import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DevolucionHistorialService } from './devolucion-historial.service';
import { CreateDevolucionHistorialDto } from './dto/create-devolucion-historial.dto';
import { UpdateDevolucionHistorialDto } from './dto/update-devolucion-historial.dto';
import { DevolucionHistorial } from './entities/devolucion-historial.entity';

@ApiTags('Historial de Devoluciones')
@Controller('devolucion-historial')
export class DevolucionHistorialController {
  constructor(
    private readonly devolucionHistorialService: DevolucionHistorialService,
  ) {}

  @Post()
  @ApiOperation({ 
    summary: 'Crear un nuevo registro en el historial de devoluciones',
    description: 
      'Registra un cambio de estado en el historial de una devolución. ' +
      'Incluye el estado anterior, nuevo estado, comentario y usuario que realizó el cambio.',
  })
  @ApiResponse({
    status: 201,
    description: 'Registro de historial creado exitosamente',
    type: DevolucionHistorial,
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
  create(
    @Body() createDevolucionHistorialDto: CreateDevolucionHistorialDto,
  ): Promise<DevolucionHistorial> {
    return this.devolucionHistorialService.create(createDevolucionHistorialDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Obtener todos los registros del historial',
    description: 'Retorna una lista completa de todos los cambios de estado registrados en el sistema.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los registros de historial ordenados cronológicamente',
    type: [DevolucionHistorial],
    isArray: true,
  })
  findAll(): Promise<DevolucionHistorial[]> {
    return this.devolucionHistorialService.findAll();
  }

  @Get('devolucion/:devolucionId')
  @ApiOperation({ 
    summary: 'Obtener el historial de una devolución específica',
    description: 
      'Retorna todos los cambios de estado de una devolución particular, ' +
      'ordenados cronológicamente desde el más antiguo al más reciente.',
  })
  @ApiParam({ 
    name: 'devolucionId', 
    description: 'ID único de la devolución',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial completo de la devolución',
    type: [DevolucionHistorial],
    isArray: true,
  })
  @ApiResponse({
    status: 404,
    description: 'Devolución no encontrada',
  })
  findByDevolucion(
    @Param('devolucionId', ParseUUIDPipe) devolucionId: string,
  ): Promise<DevolucionHistorial[]> {
    return this.devolucionHistorialService.findByDevolucion(devolucionId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener un registro de historial por ID',
    description: 'Retorna los detalles de un registro específico del historial de cambios.',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único del registro de historial',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Registro de historial encontrado',
    type: DevolucionHistorial,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Registro no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Registro de historial 550e8400-e29b-41d4-a716-446655440000 not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DevolucionHistorial> {
    return this.devolucionHistorialService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Actualizar un registro de historial',
    description: 
      'Actualiza parcialmente los datos de un registro de historial. ' +
      'Útil para corregir comentarios o información del cambio.',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único del registro de historial a actualizar',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Registro actualizado exitosamente',
    type: DevolucionHistorial,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Registro no encontrado',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDevolucionHistorialDto: UpdateDevolucionHistorialDto,
  ): Promise<DevolucionHistorial> {
    return this.devolucionHistorialService.update(
      id,
      updateDevolucionHistorialDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Eliminar un registro de historial',
    description: 
      'Elimina permanentemente un registro del historial. ' +
      'Esta operación no se puede deshacer y debe usarse con precaución.',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único del registro de historial a eliminar',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Registro eliminado exitosamente (sin contenido en la respuesta)',
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Registro no encontrado',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.devolucionHistorialService.remove(id);
  }
}
