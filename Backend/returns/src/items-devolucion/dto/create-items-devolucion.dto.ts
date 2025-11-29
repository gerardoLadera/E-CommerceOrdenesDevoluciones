import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccionItemDevolucion } from '../../common/enums/accion-item-devolucion.enum';

export class CreateItemsDevolucionDto {
  @ApiProperty({
    description: 'ID de la devolución a la que pertenece el item',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  devolucion_id: string;

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
  cantidad: number;

  @ApiProperty({
    description: 'Precio de compra unitario del producto',
    example: 299.99,
    minimum: 0,
    type: Number,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio_compra: number;

  @ApiProperty({
    description:
      'Acción solicitada para el item (reembolso, reemplazo o reparación)',
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
