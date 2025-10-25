import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ProcesarPagoDto } from './dto/procesar-pago.dto';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post('process')
    @ApiBody({ type: ProcesarPagoDto })
    @ApiResponse({
    status: 201,
    description: 'Pago procesado exitosamente',
    schema: {
        example: {
            orden_id: 'orden-123',
            cliente_id: 'cliente-456',
            monto: 413,
            metodoPago: 'Tarjeta',
            datosPago: {
            numeroTarjeta: '9999-9999-9999-9999',
            cvv: '000',
            fechaExp: '01/30',
            },
            status: 'PAGADO',
            pago_id: 'pago-789',
            fecha_pago: '2025-10-18T15:30:00Z',
        },
        },
    })
    async procesar(@Body() body: ProcesarPagoDto) {
        const datosSimulados = {
            numeroTarjeta: '9999-9999-9999-9999',
            cvv: '000',
            fechaExp: '01/30',
        };

        const pago = await this.paymentsService.procesarPago({
            ...body,
            datosPago: datosSimulados,
        });

        return {
            ...body,
            datosPago: datosSimulados,
            status: pago.status,
            pago_id: pago.pago_id,
            fecha_pago: pago.fecha_pago,
        };
    }  
}