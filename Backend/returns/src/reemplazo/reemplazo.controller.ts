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
import { ReemplazoService } from './reemplazo.service';
import { CreateReemplazoDto } from './dto/create-reemplazo.dto';
import { UpdateReemplazoDto } from './dto/update-reemplazo.dto';
import { Reemplazo } from './entities/reemplazo.entity';

@ApiTags('Reemplazos')
@Controller('reemplazo')
export class ReemplazoController {
  constructor(private readonly reemplazoService: ReemplazoService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo reemplazo',
    description:
      'Registra un reemplazo de producto asociado a una devolución. ' +
      'Especifica el producto nuevo, precio y tipo de ajuste aplicado.',
  })
  @ApiBody({
    type: CreateReemplazoDto,
    description: 'Datos del reemplazo a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Reemplazo creado exitosamente',
    type: Reemplazo,
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
  create(@Body() createReemplazoDto: CreateReemplazoDto) {
    return this.reemplazoService.create(createReemplazoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los reemplazos',
    description: 'Retorna una lista completa de todos los reemplazos registrados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de reemplazos',
    type: [Reemplazo],
    isArray: true,
  })
  findAll() {
    return this.reemplazoService.findAll();
  }

  @Get('devolucion/:devolucionId')
  @ApiOperation({
    summary: 'Obtener reemplazos por ID de devolución',
    description: 'Retorna todos los reemplazos asociados a una devolución específica.',
  })
  @ApiParam({
    name: 'devolucionId',
    description: 'ID de la devolución',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de reemplazos encontrados',
    type: [Reemplazo],
    isArray: true,
  })
  findByDevolucionId(@Param('devolucionId', ParseUUIDPipe) devolucionId: string) {
    return this.reemplazoService.findByDevolucionId(devolucionId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un reemplazo por ID',
    description: 'Retorna los detalles de un reemplazo específico.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del reemplazo',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Reemplazo encontrado',
    type: Reemplazo,
  })
  @ApiResponse({
    status: 404,
    description: 'Reemplazo no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Reemplazo 550e8400-e29b-41d4-a716-446655440000 not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reemplazoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un reemplazo',
    description:
      'Actualiza parcialmente los datos de un reemplazo existente. ' +
      'Útil para modificar el tipo de ajuste o precio del reemplazo.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del reemplazo a actualizar',
    type: String,
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateReemplazoDto,
    description: 'Campos a actualizar (todos opcionales)',
  })
  @ApiResponse({
    status: 200,
    description: 'Reemplazo actualizado exitosamente',
    type: Reemplazo,
  })
  @ApiResponse({
    status: 404,
    description: 'Reemplazo no encontrado',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReemplazoDto: UpdateReemplazoDto,
  ) {
    return this.reemplazoService.update(id, updateReemplazoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un reemplazo',
    description: 'Elimina permanentemente un reemplazo del sistema.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del reemplazo a eliminar',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Reemplazo eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Reemplazo no encontrado',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reemplazoService.remove(id);
  }
}
