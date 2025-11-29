import { ApiProperty } from '@nestjs/swagger';



export class ItemPreviewDto {
    @ApiProperty()
    imagen: string;

    @ApiProperty()
    cantidad: number;
}

export class OrderSummaryDto {

    @ApiProperty()
    _id: string;

    @ApiProperty()
    cod_orden: string;

    @ApiProperty()
    estado: string;

    @ApiProperty()
    fechaCreacion: Date;

    //Fecha estimada de entrega
    @ApiProperty()
    fechaActualizacion: Date;

    @ApiProperty()
    total: number;

    @ApiProperty({ type: [ItemPreviewDto] })
    imagenes: ItemPreviewDto[];

    @ApiProperty({ type: Date, required: false, description: 'Fecha estimada de entrega según tipo de entrega' })
    fechaEntregaEstimada: Date | null;
}