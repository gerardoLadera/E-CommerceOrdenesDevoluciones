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
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        status: 'PAGO_EXITOSO',
        pago_id: uuidv4(),
        fecha_pago: moment().tz('America/Lima').toDate(),
    };
    }

    async procesarReembolso(payload: {
        orden_id: string;
        monto: number;
    }): Promise<{ status: string; reembolso_id: string; fecha_reembolso: Date }> {
        // Simulamos un tiempo de procesamiento
        await new Promise(resolve => setTimeout(resolve, 1500));

        // En un caso real, aquí se llamaría a la pasarela de pago (Stripe, MercadoPago, etc.)
        console.log(`Procesando reembolso para la orden ${payload.orden_id} por un monto de ${payload.monto}`);

        // Devolvemos una respuesta exitosa simulada
        return {
            status: 'REEMBOLSO_EXITOSO',
            reembolso_id: uuidv4(),
            fecha_reembolso: moment().tz('America/Lima').toDate(),
        };
    }
}