import { PartialType } from '@nestjs/swagger';
import { CreateDevolucionHistorialDto } from './create-devolucion-historial.dto';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoDevolucion } from '../../common/enums/estado-devolucion.enum';

export class UpdateDevolucionHistorialDto extends PartialType(
  CreateDevolucionHistorialDto,
) {
  @ApiPropertyOptional({
    description: 'Estado anterior de la devolución',
    enum: EstadoDevolucion,
  })
  @IsEnum(EstadoDevolucion)
  @IsOptional()
  estado_anterior?: EstadoDevolucion;

  @ApiPropertyOptional({
    description: 'Nuevo estado de la devolución',
    enum: EstadoDevolucion,
  })
  @IsEnum(EstadoDevolucion)
  @IsOptional()
  estado_nuevo?: EstadoDevolucion;
  /*
  @ApiPropertyOptional({
    description: 'Comentario sobre el cambio de estado',
    example: 'Comentario actualizado',
  })
  @IsString()
  @IsOptional()
  comentario?: string;
*/
  @ApiPropertyOptional({
    description: 'ID del usuario que realizó la modificación',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  modificado_por_id?: number;
}
