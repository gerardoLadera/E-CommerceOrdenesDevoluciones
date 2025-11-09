import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoDevolucion } from '../../common/enums/estado-devolucion.enum';

export class CreateDevolucionHistorialDto {
  @ApiProperty({
    description: 'ID de la devolución',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  devolucion_id: string;

  @ApiProperty({
    description: 'Estado anterior de la devolución',
    enum: EstadoDevolucion,
    example: EstadoDevolucion.PENDIENTE,
  })
  @IsEnum(EstadoDevolucion)
  @IsNotEmpty()
  estado_anterior: EstadoDevolucion;

  @ApiProperty({
    description: 'Nuevo estado de la devolución',
    enum: EstadoDevolucion,
    example: EstadoDevolucion.PROCESANDO,
  })
  @IsEnum(EstadoDevolucion)
  @IsNotEmpty()
  estado_nuevo: EstadoDevolucion;

  @ApiPropertyOptional({
    description: 'Comentario sobre el cambio de estado',
    example: 'Devolución aprobada después de revisar la solicitud del cliente',
  })
  @IsString()
  @IsOptional()
  comentario?: string;

  @ApiProperty({
    description: 'ID del usuario que realizó la modificación',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  modificado_por_id: number;
}
