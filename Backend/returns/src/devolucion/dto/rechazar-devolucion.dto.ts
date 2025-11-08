import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RechazarDevolucionDto {
  @ApiProperty({
    description: 'ID del administrador que rechaza la devolución',
    example: 1,
  })
  @IsNotEmpty()
  adminId: number;

  @ApiProperty({
    description: 'Motivo del rechazo de la devolución',
    example: 'El producto ha sido usado y no cumple con la política de devoluciones.',
  })
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @ApiPropertyOptional({
    description: 'Comentario adicional del administrador',
    example: 'Se detectaron signos de uso excesivo en el producto.',
  })
  @IsString()
  @IsOptional()
  comentario?: string;
}
