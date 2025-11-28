import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService, DetalleProducto } from './catalog.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('CatalogService (unit)', () => {
    let service: CatalogService;
    let httpService: HttpService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
        providers: [
            CatalogService,
            {
            provide: HttpService,
            useValue: {
                post: jest.fn(),
            },
            },
        ],
        }).compile();

        service = module.get<CatalogService>(CatalogService);
        httpService = module.get<HttpService>(HttpService);

        process.env.CATALOG_SERVICE_URL = 'http://mock-catalog';
    });

    it('debería obtener detalles de productos y devolver un objeto mapeado', async () => {
        const productoIds = [1, 2];

        const mockResponse: AxiosResponse<DetalleProducto[]> = {
        data: [
            {
            productoId: 1,
            nombre: 'Laptop',
            descripcion: 'Laptop de prueba',
            imagen: 'laptop.png',
            },
            {
            productoId: 2,
            nombre: 'Mouse',
            descripcion: 'Mouse óptico',
            imagen: 'mouse.png',
            },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        };

        (httpService.post as jest.Mock).mockReturnValue(of(mockResponse));

        const result = await service.obtenerDetalles(productoIds);

        expect(httpService.post).toHaveBeenCalledWith(
        'http://mock-catalog/api/productos/detalles',
        productoIds,
        );
        expect(result[1].nombre).toBe('Laptop');
        expect(result[2].descripcion).toBe('Mouse óptico');
    });

    it('debería lanzar error si el servicio de catálogo falla', async () => {
        const productoIds = [99];

        (httpService.post as jest.Mock).mockReturnValue(
        throwError(() => new Error('Servicio de catálogo caído')),
        );

        await expect(service.obtenerDetalles(productoIds)).rejects.toThrow(
        'Servicio de catálogo caído',
        );
    });
});
