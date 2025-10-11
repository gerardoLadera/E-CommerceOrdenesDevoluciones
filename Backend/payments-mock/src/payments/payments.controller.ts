import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post('process')
    async procesar(@Body() body: {
        orden_id: string;
        cliente_id: string;
        monto: number;
        metodoPago: string;
    }){
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