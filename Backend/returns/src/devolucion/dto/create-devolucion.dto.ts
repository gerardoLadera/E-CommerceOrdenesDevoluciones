import {
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
