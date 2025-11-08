import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RechazarDevolucionDto {
  @ApiProperty({
    description: 'ID del administrador que rechaza la devolución',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  adminId: number;

  @ApiProperty({
    description: 'Motivo del rechazo de la devolución',
    example: 'El producto ha sido usado y no cumple con la política de devoluciones.',
    type: String,
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @ApiPropertyOptional({
    description: 'Comentario adicional del administrador',
    example: 'Se detectaron signos de uso excesivo en el producto.',
    type: String,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  comentario?: string;
}
