import { IsNotEmpty, IsString, IsArray, ArrayNotEmpty, IsNumber, Min,IsOptional,IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({
    example: 'prod-123',
    description: 'ID único del producto',
    maxLength: 50
  })
  @IsNotEmpty()
  @IsString()
  productoId: string;

  @ApiProperty({
    example: 2,
    description: 'Cantidad del producto',
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiProperty({ 
    example: 49.99,
    description: 'Precio unitario del producto'
  })
  @IsNumber()
  @Min(1.00)
  precioUnitario: number;

  @ApiProperty({ 
    example: 99.98,
    description: 'Precio total del item (precioUnitario * cantidad)'
  })
  @IsNumber()
  @Min(1.00)
  precioTotal: number;

  @ApiPropertyOptional({
    description: 'Atributos adicionales del producto (ej. talla, color, material)',
    example: { size: 'M', color: 'red', material: 'polyester' },
  })
  @IsOptional()
  @IsObject()
  detalleProducto?: object;
}

export class CreateOrderDto {
  @ApiProperty({
    example: 'user-123456',
    description: 'ID del cliente que realiza la orden',
    maxLength: 50
  })
  @IsNotEmpty()
  @IsString()
  clienteId: string;

  @ApiProperty({ example: 149.97, description: 'Monto total de la orden' })
  @IsNumber()
  @Min(1.00)
  totalOrden: number;

  @ApiProperty({ example: 'PEN', description: 'Moneda de la orden' })
  @IsString()
  moneda: string;

  @ApiPropertyOptional({ example: 'Tarjeta', description: 'Mètodo de pago elegido en checkout' })
  @IsString()
  metodoPago: string;

  @ApiPropertyOptional({ example: 'Calle Falsa 456, Lima, Perú', description: 'Dirección de facturación' })
  @IsOptional()
  @IsString()
  direccionFacturacion?: string;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales como descuentos, puntos, etc.',
    example: { descuento: 10, puntosUsados: 50 }
  })
  @IsOptional()
  @IsObject()
  metadata?: object;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'Lista de items en la orden',
    example: [{ productoId: 'prod-456', 
      cantidad: 2,
      precioUnitario:49.99,
      precioTotal:99.98, 
      detalleProducto: { size: 'M', color: 'red' } }],
  })
  @IsArray()
  @ArrayNotEmpty()
  items: CreateOrderItemDto[];

  @ApiProperty({
    example: 'Av. Siempre Viva 123, Springfield, USA',
    description: 'Dirección de envío completa'
  })
  @IsString()
  direccion: string;

  @ApiPropertyOptional({
    example: 'Notas especiales para la entrega',
    description: 'Información adicional opcional'
  })
  @IsOptional()
  @IsString()
  notaEnvio?: string;
}