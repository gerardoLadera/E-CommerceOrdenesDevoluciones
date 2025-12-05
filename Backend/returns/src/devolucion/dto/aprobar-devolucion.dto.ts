import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AprobarDevolucionDto {
  @ApiProperty({
    description: 'ID del administrador que aprueba la devolución',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  adminId: number;
  /*
  @ApiPropertyOptional({
    description: 'Comentario del administrador sobre la aprobación',
    example: 'Devolución aprobada. El producto cumple con los criterios de política.',
    type: String,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  comentario?: string;
*/
  @ApiPropertyOptional({
    description:
      'Método de devolución preferido (envio_domicilio, recoleccion, punto_entrega)',
    example: 'envio_domicilio',
    type: String,
    enum: ['envio_domicilio', 'recoleccion', 'punto_entrega'],
  })
  @IsString()
  @IsOptional()
  metodoDevolucion?: string;
}
