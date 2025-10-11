import { ApiProperty } from '@nestjs/swagger';

export class OrderAdminSummaryDto {

    @ApiProperty()
    _id: string;

    @ApiProperty()
    cod_orden: string;

    @ApiProperty()
    nombre: string;

    @ApiProperty()
    fechaCreacion: Date;

    @ApiProperty()
    estado: string;

    @ApiProperty()
    tiene_devolucion?: boolean;

    @ApiProperty()
    total: number;
}