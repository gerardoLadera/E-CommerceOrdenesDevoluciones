import { IsNotEmpty, IsString, IsArray, ArrayNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({
    example: 'prod-123',
    description: 'ID único del producto',
    maxLength: 50
  })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({
    example: 2,
    description: 'Cantidad del producto',
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    example: 'user-123456',
    description: 'ID del cliente que realiza la orden',
    maxLength: 50
  })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'Lista de items en la orden',
    example: [{ productId: 'prod-456', quantity: 2 }]
  })
  @IsArray()
  @ArrayNotEmpty()
  items: CreateOrderItemDto[];

  @ApiProperty({
    example: 'Av. Siempre Viva 123, Springfield, USA',
    description: 'Dirección de envío completa'
  })
  @IsString()
  shippingAddress: string;

  @ApiPropertyOptional({
    example: 'Notas especiales para la entrega',
    description: 'Información adicional opcional'
  })
  @IsString()
  notes?: string;
}