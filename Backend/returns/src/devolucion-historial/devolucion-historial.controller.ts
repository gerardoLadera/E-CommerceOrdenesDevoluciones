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
  @ApiOperation({ summary: 'Crear un nuevo registro en el historial de devoluciones' })
  @ApiResponse({
    status: 201,
    description: 'Registro de historial creado exitosamente',
    type: DevolucionHistorial,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(
    @Body() createDevolucionHistorialDto: CreateDevolucionHistorialDto,
  ): Promise<DevolucionHistorial> {
    return this.devolucionHistorialService.create(createDevolucionHistorialDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los registros del historial' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los registros de historial',
    type: [DevolucionHistorial],
  })
  findAll(): Promise<DevolucionHistorial[]> {
    return this.devolucionHistorialService.findAll();
  }

  @Get('devolucion/:devolucionId')
  @ApiOperation({ summary: 'Obtener el historial de una devolución específica' })
  @ApiParam({ name: 'devolucionId', description: 'ID de la devolución' })
  @ApiResponse({
    status: 200,
    description: 'Historial de la devolución',
    type: [DevolucionHistorial],
  })
  findByDevolucion(
    @Param('devolucionId', ParseUUIDPipe) devolucionId: string,
  ): Promise<DevolucionHistorial[]> {
    return this.devolucionHistorialService.findByDevolucion(devolucionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un registro de historial por ID' })
  @ApiParam({ name: 'id', description: 'ID del registro de historial' })
  @ApiResponse({
    status: 200,
    description: 'Registro de historial encontrado',
    type: DevolucionHistorial,
  })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DevolucionHistorial> {
    return this.devolucionHistorialService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un registro de historial' })
  @ApiParam({ name: 'id', description: 'ID del registro de historial' })
  @ApiResponse({
    status: 200,
    description: 'Registro actualizado exitosamente',
    type: DevolucionHistorial,
  })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
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
  @ApiOperation({ summary: 'Eliminar un registro de historial' })
  @ApiParam({ name: 'id', description: 'ID del registro de historial' })
  @ApiResponse({ status: 204, description: 'Registro eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.devolucionHistorialService.remove(id);
  }
}
