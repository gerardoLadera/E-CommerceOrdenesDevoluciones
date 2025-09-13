import { IsNotEmpty, IsString, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    example: 'user-123',
    description: 'ID del cliente'
  })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty({
    example: [{ productId: 'prod-456', quantity: 2 }],
    description: 'Items del pedido',
    type: [Object],
    isArray: true
  })
  @IsArray()
  @ArrayNotEmpty()
  items: { productId: string; quantity: number }[];

  @ApiProperty({
    example: 'Av. Siempre Viva 123, Springfield',
    description: 'Dirección de envío'
  })
  @IsString()
  shippingAddress: string;
}