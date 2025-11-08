import { IsEnum, IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AprobarDevolucionDto {
  @ApiProperty({
    description: 'ID del administrador que aprueba la devolución',
    example: 1,
  })
  @IsNotEmpty()
  adminId: number;

  @ApiPropertyOptional({
    description: 'Comentario del administrador sobre la aprobación',
    example: 'Devolución aprobada. El producto cumple con los criterios de política.',
  })
  @IsString()
  @IsOptional()
  comentario?: string;

  @ApiPropertyOptional({
    description: 'Método de devolución preferido',
    example: 'envio_domicilio',
  })
  @IsString()
  @IsOptional()
  metodoDevolucion?: string;
}
