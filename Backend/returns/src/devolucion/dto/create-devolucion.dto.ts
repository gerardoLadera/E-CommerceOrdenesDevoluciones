import {
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { EstadoDevolucion } from '../../common/enums/estado-devolucion.enum';

export class CreateDevolucionDto {
  @IsInt()
  orderId: number;

  @IsEnum(EstadoDevolucion)
  estado: EstadoDevolucion;

  @IsOptional()
  @IsDateString()
  fecha_procesamiento?: string;

  @IsOptional()
  @IsUUID()
  orden_reemplazo_id?: string;

  @IsOptional()
  @IsUUID()
  reemplazo_id?: string;

  @IsOptional()
  @IsUUID()
  reembolso_id?: string;
}
