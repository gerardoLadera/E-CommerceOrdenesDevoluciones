import { IsEnum, IsInt, IsUUID, Min } from 'class-validator';
import { EstadoDevolucion } from '../../common/enums/estado-devolucion.enum';

export class CreateDevolucionHistorialDto {
  @IsUUID()
  devolucion_id: string;

  @IsEnum(EstadoDevolucion)
  estado_anterior: EstadoDevolucion;

  @IsEnum(EstadoDevolucion)
  estado_nuevo: EstadoDevolucion;

  @IsInt()
  @Min(1)
  modificado_por_id: number;
}
