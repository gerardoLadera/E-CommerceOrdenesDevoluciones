/*import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoDevolucion } from '../../common/enums/estado-devolucion.enum';

export class CreateDevolucionDto {
  @ApiProperty({
    description: 'ID de la orden asociada a la devolución',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({
    description: 'Estado inicial de la devolución',
    enum: EstadoDevolucion,
    example: EstadoDevolucion.PENDIENTE,
    enumName: 'EstadoDevolucion',
  })
  @IsEnum(EstadoDevolucion)
  estado: EstadoDevolucion;

  @ApiPropertyOptional({
    description: 'Fecha de procesamiento de la devolución (ISO 8601)',
    example: '2025-11-07T10:30:00Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fecha_procesamiento?: string;

  @ApiPropertyOptional({
    description: 'ID de la orden de reemplazo si aplica',
    example: '660e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  orden_reemplazo_id?: string;

  @ApiPropertyOptional({
    description: 'ID del reemplazo asociado',
    example: '770e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  reemplazo_id?: string;

  @ApiPropertyOptional({
    description: 'ID del reembolso asociado',
    example: '880e8400-e29b-41d4-a716-446655440003',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  reembolso_id?: string;
}
*/
// src/devolucion/dto/create-devolucion.dto.ts

import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoDevolucion } from '../../common/enums/estado-devolucion.enum';
import { CreateItemDevolucionDto } from './create-item-devolucion.dto';

export class CreateDevolucionDto {
  // ---------------------------------------------------------------------
  // --- 1. PROPIEDADES DE ENTRADA NECESARIAS EN LA SOLICITUD (PAYLOAD) ---
  // ---------------------------------------------------------------------

  @ApiProperty({
    description: 'ID de la orden asociada a la devolución',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    format: 'uuid',
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: 'Razón principal de la devolución' })
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'ID del usuario o cliente que solicita la devolución',
  })
  @IsString()
  requestedBy: string;

  @ApiProperty({
    description: 'Lista de ítems de la orden incluidos en la devolución',
    type: [CreateItemDevolucionDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateItemDevolucionDto)
  items: CreateItemDevolucionDto[];

  // ---------------------------------------------------------------------
  // --- 2. PROPIEDADES DE LA ENTIDAD (Opcionales/Salida) ---
  // ---------------------------------------------------------------------

  @ApiProperty({
    description: 'Estado inicial de la devolución',
    enum: EstadoDevolucion,
    example: EstadoDevolucion.PENDIENTE,
    enumName: 'EstadoDevolucion',
  })
  @IsEnum(EstadoDevolucion)
  @IsOptional() // Hacemos opcional para que el servicio lo inicialice a PENDIENTE
  estado?: EstadoDevolucion;

  @ApiPropertyOptional({
    description: 'Fecha de procesamiento de la devolución (ISO 8601)',
    example: '2025-11-07T10:30:00Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fecha_procesamiento?: string;
}
