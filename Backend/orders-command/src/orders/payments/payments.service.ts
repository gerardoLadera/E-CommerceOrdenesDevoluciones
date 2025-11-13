import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';  

export interface PagoResponse {
    orden_id: string;
    cliente_id: string;
    monto: number;
    metodoPago: string;
    datosPago: {
        numeroTarjeta: string;
        cvv: string;
        fechaExp: string;
    };
    status: string;
    pago_id: string;
    fecha_pago: string;
}

@Injectable()
export class PaymentsClient {
    constructor(private readonly httpService: HttpService) {}

    async procesarPago(payload: {
        orden_id: string;
        cliente_id: number;
        monto: number;
        metodoPago: string;
    }) {
        const url = `${process.env.PAYMENTS_SERVICE_URL}/payments/process`;
        const response = await firstValueFrom(
        this.httpService.post<PagoResponse>(url, payload)
        );
        return response.data;
    }
}