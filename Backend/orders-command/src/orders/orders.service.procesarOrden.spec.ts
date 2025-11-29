import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderHistory } from './entities/orderHistory.entity';
import { OrderItem } from './entities/orderItem.entity';
import { Pago } from './entities/pago.entity';
import { KafkaService } from '../kafka/kafka.service';
import { EstadoOrden } from './enums/estado-orden.enum';
import { CatalogService } from './catalog/catalog.service';
import { InventoryService } from './inventory/inventory.service';
import { PaymentsClient } from './payments/payments.service';

describe('OrdersService.actualizarOrdenProcesada (unit)', () => {
    let service: OrdersService;
    const mockOrderRepo = { save: jest.fn() };
    const mockHistoryRepo = { create: jest.fn(), save: jest.fn() };
    const mockKafkaService = { emitOrderProcessed: jest.fn() };

    beforeEach(async () => {
        
        const module: TestingModule = await Test.createTestingModule({
        providers: [
            OrdersService,
            { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
            { provide: getRepositoryToken(OrderHistory), useValue: mockHistoryRepo },
            { provide: getRepositoryToken(OrderItem), useValue: {} },
            { provide: getRepositoryToken(Pago), useValue: {} },             
            { provide: KafkaService, useValue: mockKafkaService },
            { provide: InventoryService, useValue: {} },
            { provide: PaymentsClient, useValue: {} },
            { provide: CatalogService, useValue: {} }, 
        ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
    });

    it('debería actualizar la orden a PROCESADO, guardar historial y emitir evento Kafka', async () => {
        const ordenMock: any = {
        orden_id: 'uuid-001',
        estado: EstadoOrden.CONFIRMADO,
        fechaActualizacion: new Date(),
        };

        mockHistoryRepo.create.mockReturnValue({
        orden_id: ordenMock.orden_id,
        estadoAnterior: EstadoOrden.CONFIRMADO,
        estadoNuevo: EstadoOrden.PROCESADO,
        fechaModificacion: new Date(),
        modificadoPor: 'Sistema',
        motivo: 'Inventario confirmó descuento exitoso de stock reservado',
        });

        await service.actualizarOrdenProcesada(ordenMock);

        // Validamos que la orden se guardó con estado PROCESADO
        expect(mockOrderRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ estado: EstadoOrden.PROCESADO })
        );

        // Validamos que se creó y guardó historial
        expect(mockHistoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
            orden_id: ordenMock.orden_id,
            estadoAnterior: EstadoOrden.CONFIRMADO,
            estadoNuevo: EstadoOrden.PROCESADO,
            modificadoPor: 'Sistema',
        })
        );
        expect(mockHistoryRepo.save).toHaveBeenCalled();

        // Validamos que se emitió evento Kafka
        expect(mockKafkaService.emitOrderProcessed).toHaveBeenCalledWith(
        expect.objectContaining({
            eventType: 'ORDEN_PROCESADA',
            data: expect.objectContaining({
                orden_id: ordenMock.orden_id,
                estadoNuevo: EstadoOrden.PROCESADO,
            }),
        })
        );
    });
});
