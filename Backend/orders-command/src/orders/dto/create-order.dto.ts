import { IsNotEmpty, IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsArray()
  @ArrayNotEmpty()
  items: { productId: string; quantity: number }[];

  @IsString()
  shippingAddress: string;
}
