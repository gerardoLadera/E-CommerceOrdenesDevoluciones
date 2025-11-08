import { IsNotEmpty, IsString, IsArray, ArrayNotEmpty, IsNumber, Min,IsOptional,IsObject,ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiProperty({ example: 1, description: 'ID único del producto' })
  @IsNotEmpty()
  @IsNumber()
  productoId: number;

  @ApiProperty({ example: 'Camiseta Azul', description: 'Nombre del producto' })
  @IsString()
  nombreProducto: string;

  @ApiProperty({ example: 2, description: 'Cantidad del producto' })
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiProperty({ example: 50.0, description: 'Precio unitario del producto' })
  @IsNumber()
  precioUnitario: number;

  @ApiProperty({ example: 100.0, description: 'Subtotal del item' })
  @IsNumber()
  subTotal: number;

}

export class DireccionEnvioDto {
  @ApiProperty() 
  @IsString() 
  nombreCompleto: string;
  @ApiProperty() 
  @IsString() 
  telefono: string;

  @ApiProperty() 
  @IsString() 
  direccionLinea1: string;

  @ApiPropertyOptional()
  @IsOptional() 
  @IsString() 
  direccionLinea2?: string;

  @ApiProperty() 
  @IsString() 
  ciudad: string;

  @ApiProperty()
  @IsString() 
  provincia: string;

  @ApiProperty()
  @IsString() 
  codigoPostal: string;

  @ApiProperty() 
  @IsString() pais: string;
}

export class AlmacenOrigenDto {
  @ApiProperty() @IsNumber() id: number;
  @ApiProperty() @IsString() nombre: string;
  @ApiProperty() @IsString() direccion: string;
  @ApiProperty() @IsNumber() latitud: number;
  @ApiProperty() @IsNumber() longitud: number;
}

export class TiendaSeleccionadaDto {
  @ApiProperty() @IsNumber() id: number;
  @ApiProperty() @IsString() nombre: string;
  @ApiProperty() @IsString() direccion: string;
  @ApiProperty() @IsNumber() latitud: number;
  @ApiProperty() @IsNumber() longitud: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() distancia_km?: number;
}

export class CarrierSeleccionadoDto {
  @ApiProperty() @IsNumber() carrier_id: number;
  @ApiProperty() @IsString() carrier_nombre: string;
  @ApiProperty() @IsString() carrier_codigo: string;
  @ApiProperty() @IsNumber() costo_envio: number;
  @ApiProperty() @IsNumber() tiempo_estimado_dias: number;
  @ApiProperty() @IsString() fecha_entrega_estimada: string;
  @ApiProperty() @IsString() cotizacion_id: string;
}

export class EntregaDto {
  @ApiProperty({ example: 'RECOJO_TIENDA | DOMICILIO' })
  @IsString()
  tipo: string;

  @ApiProperty({ type: AlmacenOrigenDto })
  @ValidateNested()
  @Type(() => AlmacenOrigenDto)
  almacenOrigen: AlmacenOrigenDto;

  @ApiPropertyOptional({ type: TiendaSeleccionadaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TiendaSeleccionadaDto)
  tiendaSeleccionada?: TiendaSeleccionadaDto;

  @ApiPropertyOptional({ type: CarrierSeleccionadoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CarrierSeleccionadoDto)
  carrierSeleccionado?: CarrierSeleccionadoDto;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  direccionEnvioId?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() costoEnvio?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() tiempoEstimadoDias?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() fechaEntregaEstimada?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
}

export class CostosDto {
  @ApiProperty() @IsNumber() subtotal: number;
  @ApiProperty() @IsNumber() impuestos: number;
  @ApiProperty() @IsNumber() envio: number;
  @ApiProperty() @IsNumber() total: number;
}


export class CreateOrderDto {
  @ApiProperty({ example: 123, description: 'ID del usuario que realiza la orden' })
  @IsNotEmpty()
  @IsNumber()
  usuarioId: number;

  @ApiProperty({ type: DireccionEnvioDto })
  @ValidateNested()
  @Type(() => DireccionEnvioDto)
  direccionEnvio: DireccionEnvioDto;

  @ApiProperty({ type: CostosDto })
  @ValidateNested()
  @Type(() => CostosDto)
  costos: CostosDto;

  @ApiProperty({ type: EntregaDto })
  @ValidateNested()
  @Type(() => EntregaDto)
  entrega: EntregaDto;

  @ApiProperty({ example: 'SIMULADO', description: 'Método de pago elegido en checkout' })
  @IsString()
  metodoPago: string;

  @ApiProperty({ example: 'PENDIENTE', description: 'Estado inicial de la orden' })
  @IsString()
  estadoInicial: string;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'Lista de items en la orden',
    example: [{ productoId: 'prod-456', 
      cantidad: 2,
      precioUnitario:49.99,
      subTotal:99.98, 
    }],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

}