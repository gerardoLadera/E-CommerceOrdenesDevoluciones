import { ApiProperty } from '@nestjs/swagger';

export class ProcesarPagoDto {
    @ApiProperty({
        example: 'orden-123',
        description: 'ID de la orden a pagar',
    })
    orden_id: string;

    @ApiProperty({
        example: 'cliente-456',
        description: 'ID del cliente que realiza el pago',
    })
    cliente_id: string;

    @ApiProperty({
        example: 413.00,
        description: 'Monto total del pago',
    })
    monto: number;

    @ApiProperty({
        example: 'Tarjeta',
        description: 'Método de pago utilizado (Tarjeta, Yape, etc.)',
    })
    metodoPago: string;
}