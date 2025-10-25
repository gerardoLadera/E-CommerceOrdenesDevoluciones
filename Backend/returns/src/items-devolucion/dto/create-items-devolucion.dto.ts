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
} from 'class-validator';
import { AccionItemDevolucion } from '../../common/enums/accion-item-devolucion.enum';

export class CreateItemsDevolucionDto {
  @IsUUID()
  devolucion_id: string;

  @IsUUID()
  producto_id: string;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio_compra: number;

  @IsEnum(AccionItemDevolucion)
  tipo_accion: AccionItemDevolucion;

  @IsString()
  @Length(3, 3)
  moneda: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivo: string;
}
