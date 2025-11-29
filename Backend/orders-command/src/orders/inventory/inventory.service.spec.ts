import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService, ReservaPayload } from './inventory.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('InventoryService (unit)', () => {
    let service: InventoryService;
    let httpService: HttpService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
        providers: [
            InventoryService,
            {
            provide: HttpService,
            useValue: {
                post: jest.fn(),
            },
            },
        ],
        }).compile();

        service = module.get<InventoryService>(InventoryService);
        httpService = module.get<HttpService>(HttpService);

        process.env.INVENTORY_SERVICE_MODULO = 'http://mock-inventory-modulo';
        process.env.INVENTORY_SERVICE_URL = 'http://mock-inventory';
    });

    it('debería reservar stock exitosamente', async () => {
        const payload: ReservaPayload = {
        id_orden: 1,
        productos: [{ id_producto: 10, cantidad: 2 }],
        tipo_envio: 'DOMICILIO',
        };

        const mockResponse: AxiosResponse<any> = {
        data: {
            message: 'Reserva creada',
            id_orden: 1,
            tipo_envio: 'DOMICILIO',
            total_productos: 2,
            fecha_expiracion: new Date().toISOString(),
            reservas: [],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        };

        (httpService.post as jest.Mock).mockReturnValue(of(mockResponse));

        const result = await service.reserveStock(payload);

        expect(httpService.post).toHaveBeenCalledWith(
        'http://mock-inventory-modulo/api/reservas/from-order',
        payload,
        );
        expect(result.message).toBe('Reserva creada');
        expect(result.id_orden).toBe(1);
    });

    it('debería lanzar error si el servicio de inventario falla en reserva', async () => {
        const payload: ReservaPayload = {
        id_orden: 2,
        productos: [{ id_producto: 20, cantidad: 1 }],
        tipo_envio: 'RECOJO_TIENDA',
        };

        (httpService.post as jest.Mock).mockReturnValue(
        throwError(() => ({
            response: { data: { error: 'No hay stock disponible' } },
        })),
        );

        await expect(service.reserveStock(payload)).rejects.toThrow('No hay stock disponible');
    });

    it('debería descontar stock exitosamente', async () => {
        const payload = {
        ordenId: 3,
        items: [{ productoId: 30, cantidad: 5 }],
        };

        const mockResponse: AxiosResponse<any> = {
        data: {
            status: 'STOCK_DESCONTADO',
            ordenId: 3,
            productosProcesados: 1,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        };

        (httpService.post as jest.Mock).mockReturnValue(of(mockResponse));

        const result = await service.descontarStock(payload);

        expect(httpService.post).toHaveBeenCalledWith(
        'http://mock-inventory/api/reservas/descontar',
        payload,
        );
        expect(result.status).toBe('STOCK_DESCONTADO');
        expect(result.ordenId).toBe(3);
    });
});
