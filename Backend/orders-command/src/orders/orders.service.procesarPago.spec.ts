import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Pago } from './entities/pago.entity';
import { OrderHistory } from './entities/orderHistory.entity';
import { OrderItem } from './entities/orderItem.entity';
import { PaymentsClient } from './payments/payments.service';
import { KafkaService } from '../kafka/kafka.service';
import { EstadoOrden } from './enums/estado-orden.enum';
import { ServiceUnavailableException } from '@nestjs/common'; 
import { CatalogService } from './catalog/catalog.service';
import { InventoryService } from './inventory/inventory.service';


describe('OrdersService.procesarPago (unit)', () => {
    let service: OrdersService;


    const mockOrderRepo = { findOne: jest.fn(), save: jest.fn() };
    const mockPagoRepo = { create: jest.fn(), save: jest.fn() };
    const mockHistoryRepo = { create: jest.fn(), save: jest.fn() };
    const mockPaymentsClient = { procesarPago: jest.fn() };
    const mockKafkaService = { emitOrderPaid: jest.fn() };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
        providers: [
            OrdersService,
            { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
            { provide: getRepositoryToken(OrderItem), useValue: {} },
            { provide: getRepositoryToken(Pago), useValue: mockPagoRepo },
            { provide: getRepositoryToken(OrderHistory), useValue: mockHistoryRepo },
            { provide: PaymentsClient, useValue: mockPaymentsClient },
            { provide: KafkaService, useValue: mockKafkaService },
            { provide: InventoryService, useValue: {} },
            { provide: CatalogService, useValue: {} },                 

        ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
    });

    it('debería lanzar error si la orden no existe o no está en estado CREADO', async () => {
        mockOrderRepo.findOne.mockResolvedValueOnce(null);

        await expect(service.procesarPago('uuid-inexistente'))
        .rejects.toThrow('Orden no válida para procesar pago');

        mockOrderRepo.findOne.mockResolvedValueOnce({ orden_id: 'uuid-1', estado: EstadoOrden.PAGADO });
        await expect(service.procesarPago('uuid-1'))
        .rejects.toThrow('Orden no válida para procesar pago');
    });

    it('debería procesar pago exitoso y actualizar orden e historial', async () => {
        const ordenMock = {
            orden_id: 'uuid-2',
            estado: EstadoOrden.CREADO,
            usuarioId: 1,
            costos: { total: 100 },
            metodoPago: 'SIMULADO',
            items: [],
        };

        mockOrderRepo.findOne.mockResolvedValue(ordenMock);
        mockPaymentsClient.procesarPago.mockResolvedValueOnce({
            pago_id: 'pago-123',
            metodoPago: 'SIMULADO',
            status: 'PAGO_EXITOSO',
            fecha_pago: new Date().toISOString(),
            datosPago: { referencia: 'ref-123' },
        });

        mockPagoRepo.create.mockReturnValue({ pago_id: 'pago-123', estado: 'PAGO_EXITOSO' });
        mockPagoRepo.save.mockResolvedValue({ pago_id: 'pago-123', estado: 'PAGO_EXITOSO' });
        mockHistoryRepo.create.mockReturnValue({ 
            estadoAnterior: EstadoOrden.CREADO,
            estadoNuevo: EstadoOrden.PAGADO,
            fechaModificacion: new Date(),
            modificadoPor: 'Sistema',
            motivo: 'Pago exitoso confirmado',
        });
        mockHistoryRepo.save.mockResolvedValue({});

        await service.procesarPago('uuid-2');

        expect(mockPagoRepo.create).toHaveBeenCalled();
        expect(mockPagoRepo.save).toHaveBeenCalled();
        expect(mockOrderRepo.save).toHaveBeenCalledWith(expect.objectContaining({ estado: EstadoOrden.PAGADO }));
        expect(mockHistoryRepo.save).toHaveBeenCalled();
        expect(mockKafkaService.emitOrderPaid).toHaveBeenCalledWith(expect.objectContaining({
        eventType: 'ORDEN_PAGADA',
        }));
    });

    it('debería guardar el intento de pago pero no actualizar la orden ni emitir evento si el pago falla', async () => {
        const ordenMock = {
            orden_id: 'uuid-3',
            estado: EstadoOrden.CREADO,
            usuarioId: 1,
            costos: { total: 100 },
            metodoPago: 'SIMULADO',
            items: [],
        };

        mockOrderRepo.findOne.mockResolvedValueOnce(ordenMock);
        mockPaymentsClient.procesarPago.mockResolvedValueOnce({
            pago_id: 'pago-456',
            metodoPago: 'SIMULADO',
            status: 'PAGO_FALLIDO',
            fecha_pago: new Date(),
            datosPago: { referencia: 'ref-456' },
        });

        mockPagoRepo.create.mockReturnValue({ pago_id: 'pago-456', estado: 'PAGO_FALLIDO' });
        mockPagoRepo.save.mockResolvedValue({ pago_id: 'pago-456', estado: 'PAGO_FALLIDO' });

        await service.procesarPago('uuid-3');

        expect(mockPagoRepo.create).toHaveBeenCalled();
        expect(mockPagoRepo.save).toHaveBeenCalled();
        expect(mockOrderRepo.save).not.toHaveBeenCalled();
        expect(mockHistoryRepo.save).not.toHaveBeenCalled();
        expect(mockKafkaService.emitOrderPaid).not.toHaveBeenCalled();
    });

    it('debería lanzar ServiceUnavailableException si el servicio de pagos no responde', async () => {
        const ordenMock = {
            orden_id: 'uuid-4',
            estado: EstadoOrden.CREADO,
            usuarioId: 1,
            costos: { total: 200 },
            metodoPago: 'SIMULADO',
            items: [],
        };

        mockOrderRepo.findOne.mockResolvedValueOnce(ordenMock);

        // Error simulado del cliente de pagos
        mockPaymentsClient.procesarPago.mockRejectedValueOnce(new Error('Servidor de pagos caído'));

        await expect(service.procesarPago('uuid-4'))
        .rejects.toThrow(ServiceUnavailableException);

        // Validamos que no se guardó nada ni se emitió evento
        expect(mockPagoRepo.create).not.toHaveBeenCalled();
        expect(mockPagoRepo.save).not.toHaveBeenCalled();
        expect(mockOrderRepo.save).not.toHaveBeenCalled();
        expect(mockHistoryRepo.save).not.toHaveBeenCalled();
        expect(mockKafkaService.emitOrderPaid).not.toHaveBeenCalled();
    });
});
