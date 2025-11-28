import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsClient, PagoResponse } from './payments.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('PaymentsClient (unit)', () => {
    let service: PaymentsClient;
    let httpService: HttpService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
        providers: [
            PaymentsClient,
            {
            provide: HttpService,
            useValue: {
                post: jest.fn(),
            },
            },
        ],
        }).compile();

        service = module.get<PaymentsClient>(PaymentsClient);
        httpService = module.get<HttpService>(HttpService);

        process.env.PAYMENTS_SERVICE_URL = 'http://mock-payments'; // mock URL
    });

    it('debería llamar al endpoint de pagos y devolver la respuesta', async () => {
        const payload = {
        orden_id: 'ORD-001',
        cliente_id: 123,
        monto: 100,
        metodoPago: 'TARJETA',
        };

        const mockResponse: AxiosResponse<PagoResponse> = {
        data: {
            orden_id: 'ORD-001',
            cliente_id: '123',
            monto: 100,
            metodoPago: 'TARJETA',
            datosPago: {
            numeroTarjeta: '4111111111111111',
            cvv: '123',
            fechaExp: '12/25',
            },
            status: 'PAGO_EXITOSO',
            pago_id: 'PAGO-001',
            fecha_pago: new Date().toISOString(),
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        };

        (httpService.post as jest.Mock).mockReturnValue(of(mockResponse));

        const result = await service.procesarPago(payload);

        expect(httpService.post).toHaveBeenCalledWith(
        'http://mock-payments/payments/process',
        payload,
        );
        expect(result.status).toBe('PAGO_EXITOSO');
        expect(result.pago_id).toBe('PAGO-001');
    });

    it('debería lanzar error si el servicio de pagos falla', async () => {
        const payload = {
        orden_id: 'ORD-002',
        cliente_id: 456,
        monto: 200,
        metodoPago: 'TARJETA',
        };

        (httpService.post as jest.Mock).mockReturnValue(
        throwError(() => new Error('Servicio caído')),
        );

        await expect(service.procesarPago(payload)).rejects.toThrow('Servicio caído');
    });
});
