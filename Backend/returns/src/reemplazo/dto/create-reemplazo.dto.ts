import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReemplazoDto {
  @ApiProperty({
    description: 'ID de la devolución asociada al reemplazo',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  devolucion_id: string;

  @ApiProperty({
    description: 'ID del item de devolución que será reemplazado',
    example: '660e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsUUID()
  item_devolucion_id: string;

  @ApiProperty({
    description: 'ID del producto de reemplazo',
    example: 12345,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  producto_id: number;

  @ApiProperty({
    description: 'Precio del producto de reemplazo',
    example: 349.99,
    minimum: 0,
    type: Number,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio_reemplazo: number;

  @ApiProperty({
    description: 'Tipo de ajuste aplicado (sin_cargo, cargo_adicional, credito)',
    example: 'sin_cargo',
    maxLength: 50,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  ajuste_tipo: string;

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
