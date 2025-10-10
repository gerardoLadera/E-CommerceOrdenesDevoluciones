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

export class CreateReemplazoDto {
  @IsUUID()
  devolucion_id: string;

  @IsUUID()
  item_devolucion_id: string;

  @IsInt()
  @Min(1)
  producto_id: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio_reemplazo: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  ajuste_tipo: string;

  @IsString()
  @Length(3, 3)
  moneda: string;
}
