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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccionItemDevolucion } from '../../common/enums/accion-item-devolucion.enum';

export class CreateItemsDevolucionDto {
  @ApiProperty({
    description: 'ID de la devolución a la que pertenece el item',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  devolucion_id?: string;

  // DATOS DEL PRODUCTO DEVUELTO
  @ApiProperty({
    description: 'ID del producto que se está devolviendo',
    example: '60001',
    type: Number,
  })
  @IsInt()
  @Min(1)
  producto_id_dev?: number;

  @ApiProperty({
    description: 'Cantidad de unidades del producto a devolver',
    example: 2,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  cantidad_dev?: number;

  @ApiProperty({
    description: 'Precio de compra unitario del producto',
    example: 299.99,
    minimum: 0,
    type: Number,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio_unitario_dev?: number;

  // DATOS DEL PRODUCTO NUEVO
  @ApiPropertyOptional({
    description: 'ID del producto nuevo que se enviará en reemplazo',
    example: 60002,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  producto_id_new?: number;

  @ApiPropertyOptional({
    description: 'Precio de compra unitario del producto nuevo',
    example: 350.0,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio_unitario_new?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de unidades nuevas a enviar',
    example: 1,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  cantidad_new?: number;

  // CAMPOS GENERALES
  @ApiProperty({
    description: 'Acción solicitada para el item (reembolso o reemplazo)',
    enum: AccionItemDevolucion,
    example: AccionItemDevolucion.REEMBOLSO,
    enumName: 'AccionItemDevolucion',
  })
  @IsEnum(AccionItemDevolucion)
  tipo_accion: AccionItemDevolucion;
  /*
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
*/
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
