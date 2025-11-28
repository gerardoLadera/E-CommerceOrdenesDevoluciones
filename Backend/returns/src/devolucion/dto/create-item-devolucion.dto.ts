// En returns/src/devolucion/dto/create-item-devolucion.dto.ts

import { IsNumber, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
// Asegúrate de que este enum exista en tu ruta:
import { AccionItemDevolucion } from '../../common/enums/accion-item-devolucion.enum';

export class CreateItemDevolucionDto {
  @ApiProperty({
    description: 'ID del producto a devolver',
    example: 'PROD-XYZ',
  })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Cantidad devuelta', example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Motivo de la devolución',
    example: 'damaged_on_delivery',
  })
  @IsString()
  motive: string;

  @ApiProperty({
    description: 'Acción solicitada (reembolso/reemplazo)',
    enum: AccionItemDevolucion,
    example: 'reemplazo',
  })
  @IsEnum(AccionItemDevolucion)
  action: AccionItemDevolucion;

  @ApiProperty({
    description: 'Precio de compra unitario del ítem',
    example: 150.0,
    type: Number,
  })
  @IsNumber()
  purchasePrice: number;

  @ApiProperty({ description: 'Código ISO de la moneda', example: 'USD' })
  @IsString()
  moneda: string;
}
