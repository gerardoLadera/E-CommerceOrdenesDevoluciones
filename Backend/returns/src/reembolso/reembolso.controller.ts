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
import { ReembolsoService } from './reembolso.service';
import { CreateReembolsoDto } from './dto/create-reembolso.dto';
import { UpdateReembolsoDto } from './dto/update-reembolso.dto';
import { Reembolso } from './entities/reembolso.entity';

@ApiTags('Reembolsos')
@Controller('reembolso')
export class ReembolsoController {
  constructor(private readonly reembolsoService: ReembolsoService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo reembolso',
    description:
      'Registra un reembolso asociado a una devolución. ' +
      'Incluye el monto, fecha de procesamiento y datos de la transacción.',
  })
  @ApiBody({
    type: CreateReembolsoDto,
    description: 'Datos del reembolso a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Reembolso creado exitosamente',
    type: Reembolso,
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
  create(@Body() createReembolsoDto: CreateReembolsoDto) {
    return this.reembolsoService.create(createReembolsoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los reembolsos',
    description: 'Retorna una lista completa de todos los reembolsos registrados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de reembolsos',
    type: [Reembolso],
    isArray: true,
  })
  findAll() {
    return this.reembolsoService.findAll();
  }

  @Get('devolucion/:devolucionId')
  @ApiOperation({
    summary: 'Obtener reembolso por ID de devolución',
    description: 'Retorna el reembolso asociado a una devolución específica.',
  })
  @ApiParam({
    name: 'devolucionId',
    description: 'ID de la devolución',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Reembolso encontrado',
    type: Reembolso,
  })
  @ApiResponse({
    status: 404,
    description: 'Reembolso no encontrado para esta devolución',
  })
  findByDevolucionId(@Param('devolucionId', ParseUUIDPipe) devolucionId: string) {
    return this.reembolsoService.findByDevolucionId(devolucionId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un reembolso por ID',
    description: 'Retorna los detalles de un reembolso específico.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del reembolso',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Reembolso encontrado',
    type: Reembolso,
  })
  @ApiResponse({
    status: 404,
    description: 'Reembolso no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Reembolso 550e8400-e29b-41d4-a716-446655440000 not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reembolsoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un reembolso',
    description:
      'Actualiza parcialmente los datos de un reembolso existente. ' +
      'Útil para cambiar el estado o actualizar información de la transacción.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del reembolso a actualizar',
    type: String,
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateReembolsoDto,
    description: 'Campos a actualizar (todos opcionales)',
  })
  @ApiResponse({
    status: 200,
    description: 'Reembolso actualizado exitosamente',
    type: Reembolso,
  })
  @ApiResponse({
    status: 404,
    description: 'Reembolso no encontrado',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReembolsoDto: UpdateReembolsoDto,
  ) {
    return this.reembolsoService.update(id, updateReembolsoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un reembolso',
    description: 'Elimina permanentemente un reembolso del sistema.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del reembolso a eliminar',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Reembolso eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Reembolso no encontrado',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reembolsoService.remove(id);
  }
}
