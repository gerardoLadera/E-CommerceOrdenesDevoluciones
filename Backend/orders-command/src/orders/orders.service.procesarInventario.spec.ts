import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { EstadoOrden } from './enums/estado-orden.enum';
import { KafkaService } from '../kafka/kafka.service';
import { InventoryService } from './inventory/inventory.service';
import { PaymentsClient } from './payments/payments.service';
import { CatalogService } from './catalog/catalog.service';

import { Order } from './entities/order.entity';
import { OrderHistory } from './entities/orderHistory.entity';
import { OrderItem } from './entities/orderItem.entity';
import { Pago } from './entities/pago.entity';

describe('OrdersService.procesarInventario', () => {
    let service: OrdersService;

    const mockOrderRepo = { save: jest.fn() };
    const mockHistoryRepo = { create: jest.fn(), save: jest.fn() };
    const mockKafkaService = { emitOrderStatusUpdated: jest.fn() };
    const inventoryService = { descontarStock: jest.fn() };


    beforeEach(async () => {

        const module: TestingModule = await Test.createTestingModule({
        providers: [
            OrdersService,
            { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
            { provide: getRepositoryToken(OrderHistory), useValue: mockHistoryRepo },
            { provide: getRepositoryToken(OrderItem), useValue: {} },
            { provide: getRepositoryToken(Pago), useValue: {} }, 
            { provide: KafkaService, useValue: mockKafkaService },
            { provide: InventoryService, useValue: inventoryService },
            { provide: PaymentsClient, useValue: {} }, 
            { provide: CatalogService, useValue: {} }, 
        ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
        // mockear actualizarOrdenProcesada para no depender de su implementación
        service['actualizarOrdenProcesada'] = jest.fn();
    });

    it('debe lanzar BadRequestException si la orden no está CONFIRMADA', async () => {
        const orden: Partial<Order>  = { estado: EstadoOrden.CREADO, items: [] };

        await expect(service.procesarInventario(orden as Order))
        .rejects
        .toThrow(BadRequestException);
    });

    it('debe lanzar ServiceUnavailableException si inventoryService falla', async () => {
        const orden: Partial<Order> = {
            estado: EstadoOrden.CONFIRMADO,
            num_orden: 1,
            items: [{  productoId: 1, cantidad: 2 } as unknown as OrderItem],
        };
        inventoryService.descontarStock.mockRejectedValue(new Error('Error externo'));

        await expect(service.procesarInventario(orden as Order))
        .rejects
        .toThrow(ServiceUnavailableException);
    });

    it('debe lanzar BadRequestException si inventario no confirma descuento', async () => {
        const orden: Partial<Order> = {
        estado: EstadoOrden.CONFIRMADO,
        num_orden: 1,
        items: [{ productoId: 1, cantidad: 2 }as unknown as OrderItem],
        };
        inventoryService.descontarStock.mockResolvedValue({ status: 'ERROR' });

        await expect(service.procesarInventario(orden as Order))
        .rejects
        .toThrow(BadRequestException);
    });

    it('debe llamar a actualizarOrdenProcesada si inventario confirma descuento', async () => {
        const orden: Partial<Order> = {
        estado: EstadoOrden.CONFIRMADO,
        num_orden: 1,
        items: [{ productoId: 1, cantidad: 2 } as unknown as OrderItem],
        };
        inventoryService.descontarStock.mockResolvedValue({ status: 'STOCK_DESCONTADO' });

        await service.procesarInventario(orden as Order);

        expect(service['actualizarOrdenProcesada']).toHaveBeenCalledWith(orden);
    });
});
