import { ApiProperty } from '@nestjs/swagger';

export class ProcesarReembolsoDto {
    @ApiProperty({
        example: 'orden-123',
        description: 'ID de la orden original que se va a reembolsar',
    })
    orden_id: string;

    @ApiProperty({
        example: 150.50,
        description: 'Monto a reembolsar',
    })
    monto: number;

    @ApiProperty({
        example: 'Producto defectuoso',
        description: 'Motivo del reembolso',
        required: false,
    })
    motivo?: string;
}