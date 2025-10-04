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
  subTotal: number;

  @ApiPropertyOptional({
    description: 'Atributos del producto (ej. talla, color, material)',
    example: {  nombre: 'Zapatilla Nike', descripcion:'Zapatilla running  Nike edición 2025',marca:'Nike',imagen:"url_imagen" },
  })
  @IsObject()
  detalleProducto: object;
}

export class CreateOrderDto {
  @ApiProperty({
    example: 'user-123456',
    description: 'ID del usuario que realiza la orden',
    maxLength: 50
  })
  @IsNotEmpty()
  @IsString()
  usuarioId: string;

  @ApiProperty({
    example: { nombreCompleto: "Juan Pérez",
      telefono:"+51 987654321", 
      direccionLinea1: "Calle Falsa 123",
      direccionLinea2: "Departamento 456",
      ciudad: "Lima",
      provincia: "Lima", 
      codigoPostal: "15001",
      pais: "Perú",
      referencia: "Frente al parque"
    },
    description: 'Dirección de envío completa'
  })
  @IsObject()
  direccionEnvio: object;

  @ApiPropertyOptional({
    description: 'Costos de la orden en formato JSON',
    example: {subtotal:350.00, impuestos:63.00,envio:0.00, total:413.00}
  })
  @IsObject()
  costos: object;

  @ApiPropertyOptional({
    description:'Informacion de la entrega de la orden en formato JSON',
    example: {tipo:'RECOJO_EN_TIENDA', tiendaId:5,direccionEnvioId:12}
  })
  @IsObject()
  entrega: object;

  @ApiProperty({ example: 'Tarjeta', description: 'Mètodo de pago elegido en checkout' })
  @IsString()
  metodoPago: string;

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



  // @ApiProperty({ example: 149.97, description: 'Monto total de la orden' })
  // @IsNumber()
  // @Min(1.00)
  // totalOrden: number;

  // @ApiProperty({ example: 'PEN', description: 'Moneda de la orden' })
  // @IsString()
  // moneda: string;



  // @ApiPropertyOptional({ example: 'Calle Falsa 456, Lima, Perú', description: 'Dirección de facturación' })
  // @IsOptional()
  // @IsString()
  // direccionFacturacion?: string;


  // @ApiPropertyOptional({
  //   example: 'Notas especiales para la entrega',
  //   description: 'Información adicional opcional'
  // })
  // @IsOptional()
  // @IsString()
  // notaEnvio?: string;
}