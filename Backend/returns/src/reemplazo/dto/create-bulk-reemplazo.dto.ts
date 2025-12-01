import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsUUID, IsInt, IsNumber, IsString, MaxLength, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';

/**
 * DTO para un item de devolución con su reemplazo asociado
 */
export class ItemConReemplazoDto {
  @ApiProperty({
    description: 'ID del producto original que se devuelve',
    example: 1001,
    type: Number,
  })
  @IsInt()
  producto_devuelto_id: number;

  @ApiProperty({
    description: 'Cantidad de unidades a devolver',
    example: 1,
    type: Number,
  })
  @IsInt()
  cantidad_devuelta: number;

  @ApiProperty({
    description: 'Precio de compra unitario del producto original',
    example: 50.00,
    type: Number,
  })
  @IsNumber()
  precio_compra: number;

  @ApiProperty({
    description: 'Motivo de la devolución',
    example: 'Producto defectuoso',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  motivo: string;

  @ApiProperty({
    description: 'ID del producto de reemplazo',
    example: 101,
    type: Number,
  })
  @IsInt()
  producto_reemplazo_id: number;

  @ApiProperty({
    description: 'Precio del producto de reemplazo',
    example: 50.00,
    type: Number,
  })
  @IsNumber()
  precio_reemplazo: number;

  @ApiProperty({
    description: 'Tipo de ajuste aplicado',
    example: 'sin_cargo',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  ajuste_tipo: string;
}

/**
 * DTO para crear múltiples reemplazos con sus items de devolución
 */
export class CreateBulkReemplazoDto {
  @ApiProperty({
    description: 'ID de la devolución',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  devolucion_id: string;

  @ApiProperty({
    description: 'Código ISO de la moneda',
    example: 'PEN',
    maxLength: 3,
  })
  @IsString()
  @MaxLength(3)
  moneda: string;

  @ApiProperty({
    description: 'Array de items con sus reemplazos',
    type: [ItemConReemplazoDto],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemConReemplazoDto)
  items: ItemConReemplazoDto[];
}
