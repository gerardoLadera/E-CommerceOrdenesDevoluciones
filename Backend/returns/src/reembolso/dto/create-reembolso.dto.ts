import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReembolsoDto {
  @ApiProperty({
    description: 'ID de la devolución asociada al reembolso',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  devolucion_id: string;

  @ApiProperty({
    description: 'Monto total del reembolso',
    example: 599.98,
    minimum: 0,
    type: Number,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monto: number;

  @ApiProperty({
    description: 'Fecha de procesamiento del reembolso (ISO 8601)',
    example: '2025-11-07T14:30:00Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  fecha_procesamiento: string;

  @ApiProperty({
    description: 'Estado del reembolso (pendiente, procesado, completado, fallido)',
    example: 'pendiente',
    maxLength: 50,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  estado: string;

  @ApiProperty({
    description: 'ID de la transacción del sistema de pagos',
    example: 'TXN-20251107-123456-ABC',
    maxLength: 255,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  transaccion_id: string;

  @ApiProperty({
    description: 'Código ISO de la moneda (3 caracteres)',
    example: 'USD',
    minLength: 3,
    maxLength: 3,
    type: String,
  })
  @IsString()
  @Length(3, 3)
  moneda: string;
}
