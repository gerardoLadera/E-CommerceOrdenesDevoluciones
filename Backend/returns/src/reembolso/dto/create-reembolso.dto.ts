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

export class CreateReembolsoDto {
  @IsUUID()
  devolucion_id: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monto: number;

  @IsDateString()
  fecha_procesamiento: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  estado: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  transaccion_id: string;

  @IsString()
  @Length(3, 3)
  moneda: string;
}
