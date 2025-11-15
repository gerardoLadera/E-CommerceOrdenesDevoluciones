import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderHistory } from './entities/orderHistory.entity';
import { InventoryService } from './inventory/inventory.service';
import { KafkaService } from '../kafka/kafka.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EstadoOrden } from './enums/estado-orden.enum';
import { OrderItem } from './entities/orderItem.entity';
import { Pago } from './entities/pago.entity';
import { PaymentsClient } from './payments/payments.service';
import { CatalogService } from './catalog/catalog.service';

describe('OrdersService.confirmarOrden (unit)', () => {
    let service: OrdersService;
    let mockOrderRepo: any;
    let mockHistoryRepo: any;
    let mockInventoryService: any;
    let mockKafkaService: any;
    let mockOrderItemRepo: any;
    let mockPagoRepo: any;
    let mockPaymentsClient: any;
    let mockCatalogService: any;

    beforeEach(async () => {
    mockOrderRepo = { findOne: jest.fn(), save: jest.fn() };
    mockOrderItemRepo = { create: jest.fn(), save: jest.fn() };   // <--- nuevo
    mockHistoryRepo = { create: jest.fn(), save: jest.fn() };
    mockPagoRepo = { create: jest.fn(), save: jest.fn() };        // <--- nuevo
    mockInventoryService = { descontarStock: jest.fn().mockResolvedValue({ success: true }) };
    mockKafkaService = { emitOrderStatusUpdated: jest.fn() };
    mockPaymentsClient = { procesarPago: jest.fn() };             // <--- nuevo
    mockCatalogService = { obtenerDetalles: jest.fn() };          // <--- nuevo

    const module: TestingModule = await Test.createTestingModule({
        providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: mockOrderItemRepo },   // <--- agregado
        { provide: getRepositoryToken(OrderHistory), useValue: mockHistoryRepo },
        { provide: getRepositoryToken(Pago), useValue: mockPagoRepo },             // <--- agregado
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: KafkaService, useValue: mockKafkaService },
        { provide: PaymentsClient, useValue: mockPaymentsClient },                 // <--- agregado
        { provide: CatalogService, useValue: mockCatalogService },                 // <--- agregado
        ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    });

    it('debería lanzar NotFoundException si la orden no existe', async () => {
        mockOrderRepo.findOne.mockResolvedValue(null);

        await expect(service.confirmarOrden('uuid-123', 'admin-user'))
        .rejects.toThrow(NotFoundException);
    });

    it('debería lanzar BadRequestException si la orden no está en estado PAGADO', async () => {
        mockOrderRepo.findOne.mockResolvedValue({ orden_id: 'uuid-123', estado: EstadoOrden.CREADO });

        await expect(service.confirmarOrden('uuid-123', 'admin-user'))
        .rejects.toThrow(BadRequestException);
    });

    it('debería confirmar la orden si está en estado PAGADO', async () => {
        const ordenMock = {
        orden_id: 'uuid-123',
        estado: EstadoOrden.PAGADO,
        items: [{ productoId: 1, cantidad: 2 }],
        num_orden: 1,
        };

        mockOrderRepo.findOne.mockResolvedValue(ordenMock);
        mockOrderRepo.save.mockResolvedValue({ ...ordenMock, estado: EstadoOrden.CONFIRMADO });
        mockHistoryRepo.create.mockReturnValue({
            orden_id: 'uuid-123',
            estadoAnterior: EstadoOrden.PAGADO,
            estadoNuevo: EstadoOrden.CONFIRMADO,
            fechaModificacion: new Date(),
            modificadoPor: 'admin-user',
            motivo: 'Orden con pago procesado correctamente',
        });
        mockHistoryRepo.save.mockResolvedValue({});

        await service.confirmarOrden('uuid-123', 'admin-user');

        expect(mockOrderRepo.save).toHaveBeenCalledWith(expect.objectContaining({ estado: EstadoOrden.CONFIRMADO }));
        expect(mockHistoryRepo.save).toHaveBeenCalled();
        expect(mockInventoryService.descontarStock).toHaveBeenCalledWith(expect.objectContaining({
        ordenId: ordenMock.num_orden,
        }));
        expect(mockKafkaService.emitOrderStatusUpdated).toHaveBeenCalledWith(expect.objectContaining({
        eventType: 'ORDEN_CONFIRMADA',
        }));
    });
});
