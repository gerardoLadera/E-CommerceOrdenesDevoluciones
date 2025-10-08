import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';

@Injectable()
export class PaymentsService {
    async procesarPago(payload: {
        orden_id: string;
        cliente_id: string;
        monto: number;
        metodoPago: string;
        datosPago: {
            numeroTarjeta: string;
            cvv: string;
            fechaExp: string;
        };
    }): Promise<{ status: string; pago_id: string; fecha_pago: Date}> {
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simula procesamiento

    return {
        status: 'PAGO_EXITOSO',
        pago_id: uuidv4(),
        fecha_pago: moment().tz('America/Lima').toDate(),
    };
    }
}