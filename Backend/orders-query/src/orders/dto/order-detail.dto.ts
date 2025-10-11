import { ApiProperty } from '@nestjs/swagger';

class ProductoDto {
    @ApiProperty()
    nombre: string;

    @ApiProperty()
    marca: string;

    @ApiProperty()
    descripcion: string;

    @ApiProperty()
    modelo: string;

    @ApiProperty()
    imagen: string;
}

class ItemDto {
    @ApiProperty()
    cantidad: number;

    @ApiProperty()
    precioUnitario: number;

    @ApiProperty()
    subTotal: number;

    @ApiProperty({ type: ProductoDto })
    detalleProducto: ProductoDto;
}

class CostosDto {
    @ApiProperty()
    subtotal: number;

    @ApiProperty()
    envio: number;

    @ApiProperty()
    total: number;
}

class DireccionDto {
    @ApiProperty()
    nombreCompleto: string;
    @ApiProperty()
    direccionLinea1: string;
    @ApiProperty()
    ciudad: string;
    @ApiProperty()
    pais: string;
}

export class OrderDetailDto {
    @ApiProperty()
    cod_orden: string;

    @ApiProperty()
    estado: string;

    @ApiProperty()
    fechaCreacion: Date;

    @ApiProperty()
    fechaActualizacion: Date;

    @ApiProperty({ type: CostosDto })
    costos: CostosDto;

    @ApiProperty({ type: [ItemDto] })
    items: ItemDto[];

    @ApiProperty({ type: DireccionDto })
    direccionEnvio: DireccionDto;

    @ApiProperty()
    metodoPago: string;

    @ApiProperty()
    usuarioId: string;
}