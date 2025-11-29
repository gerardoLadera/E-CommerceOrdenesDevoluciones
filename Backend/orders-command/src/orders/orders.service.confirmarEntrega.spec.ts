import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Order } from './entities/order.entity';
import { OrderHistory } from './entities/orderHistory.entity';
import { OrderItem } from './entities/orderItem.entity';
import { Pago } from './entities/pago.entity';
import { EstadoOrden } from './enums/estado-orden.enum'; 
import { KafkaService } from '../kafka/kafka.service';
import { PaymentsClient } from './payments/payments.service';
import { CatalogService } from './catalog/catalog.service';
import { InventoryService } from './inventory/inventory.service';

describe('OrdersService.confirmarEntrega', () => {
    let service: OrdersService;

    // Mocks de repositorios y servicios
    const orderRepository = { findOne: jest.fn(), save: jest.fn() };
    const orderHistoryRepository = { create: jest.fn(), save: jest.fn() };
    const kafkaService = { emitOrderDelivered: jest.fn() };


    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
        providers: [
            OrdersService,
            { provide: getRepositoryToken(Order), useValue: orderRepository },
            { provide: getRepositoryToken(OrderItem), useValue: {} },
            { provide: getRepositoryToken(OrderHistory), useValue: orderHistoryRepository },
            { provide: getRepositoryToken(Pago), useValue: {} },
            { provide: KafkaService, useValue: kafkaService },
            { provide: InventoryService, useValue: {} },
            { provide: PaymentsClient, useValue: {} },
            { provide: CatalogService, useValue: {} },
        ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
    });

    it('debe lanzar NotFoundException si la orden no existe', async () => {
        orderRepository.findOne.mockResolvedValue(null);

        await expect(service.confirmarEntrega(123, {}))
        .rejects
        .toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si la orden ya está ENTREGADA', async () => {
    const orden = { num_orden: 123, estado: EstadoOrden.ENTREGADO };
    orderRepository.findOne.mockResolvedValue(orden);

    await expect(service.confirmarEntrega(123, {}))
        .rejects
        .toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si la orden no está en estado PROCESADO', async () => {
        const orden = { num_orden: 123, estado: EstadoOrden.CREADO };
        orderRepository.findOne.mockResolvedValue(orden);

        await expect(service.confirmarEntrega(123, {}))
        .rejects
        .toThrow(BadRequestException);
    });

    it('debe actualizar la orden a ENTREGADO si está en PROCESADO', async () => {
        const orden = {
        orden_id: 'abc',
        num_orden: 123,
        estado: EstadoOrden.PROCESADO,
        items: [],
        };
        orderRepository.findOne.mockResolvedValue(orden);
        orderHistoryRepository.create.mockImplementation((h) => h);

        await service.confirmarEntrega(123, { mensaje: 'Prueba', evidencias: [] });

        expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ estado: EstadoOrden.ENTREGADO })
        );
        expect(orderHistoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ estadoNuevo: EstadoOrden.ENTREGADO })
        );
        expect(kafkaService.emitOrderDelivered).toHaveBeenCalledWith(
        expect.objectContaining({
            eventType: 'ORDEN_ENTREGADA',
            data: expect.objectContaining({ estadoNuevo: EstadoOrden.ENTREGADO }),
        })
        );
    });
});