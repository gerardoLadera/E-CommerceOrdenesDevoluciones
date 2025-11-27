import { IsArray, IsUUID, ValidateNested, ArrayMinSize, IsEnum, IsInt, IsNumber, IsString, IsNotEmpty, Min, MaxLength, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AccionItemDevolucion } from '../../common/enums/accion-item-devolucion.enum';

/**
 * DTO para items individuales sin devolucion_id
 * Ya que el devolucion_id viene en el nivel superior
 */
export class ItemWithoutDevolucionIdDto {
  @ApiProperty({
    description: 'ID del producto que se está devolviendo',
    example: '660e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsUUID()
  producto_id: string;

  @ApiProperty({
    description: 'Cantidad de unidades del producto a devolver',
    example: 2,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  cantidad: number;

  @ApiProperty({
    description: 'Precio de compra unitario del producto',
    example: 299.99,
    minimum: 0,
    type: Number,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  precio_compra: number;

  @ApiProperty({
    description: 'Acción solicitada para el item (reembolso, reemplazo o reparación)',
    enum: AccionItemDevolucion,
    example: AccionItemDevolucion.REEMBOLSO,
    enumName: 'AccionItemDevolucion',
  })
  @IsEnum(AccionItemDevolucion)
  tipo_accion: AccionItemDevolucion;

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

  @ApiProperty({
    description: 'Motivo de la devolución del item',
    example: 'Producto defectuoso - La pantalla no enciende',
    maxLength: 255,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivo: string;
}

/**
 * DTO para crear múltiples items de devolución de una sola vez
 * Útil para asignar varios productos a una devolución en una sola operación
 */
export class CreateMultipleItemsDevolucionDto {
  @ApiProperty({
    description: 'ID de la devolución a la que se asignarán todos los items',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  devolucion_id: string;

  @ApiProperty({
    description: 'Array de items a crear para la devolución',
    type: [ItemWithoutDevolucionIdDto],
    isArray: true,
    example: [
      {
        producto_id: '660e8400-e29b-41d4-a716-446655440001',
        cantidad: 2,
        precio_compra: 299.99,
        tipo_accion: 'reembolso',
        moneda: 'USD',
        motivo: 'Producto defectuoso',
      },
      {
        producto_id: '660e8400-e29b-41d4-a716-446655440002',
        cantidad: 1,
        precio_compra: 150.0,
        tipo_accion: 'reemplazo',
        moneda: 'USD',
        motivo: 'Talla incorrecta',
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos un item' })
  @ValidateNested({ each: true })
  @Type(() => ItemWithoutDevolucionIdDto)
  items: ItemWithoutDevolucionIdDto[];
}
