import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import {  Repository } from 'typeorm';
import { OrdersModule } from '../src/orders/orders.module';
import { EstadoOrden } from '../src/orders/enums/estado-orden.enum';
import { InventoryService } from '../src/orders/inventory/inventory.service';
import { KafkaService } from '../src/kafka/kafka.service';
import { PaymentsClient } from '../src/orders/payments/payments.service';
import { CatalogService } from '../src/orders/catalog/catalog.service';

import { Order } from '../src/orders/entities/order.entity';
import { OrderItem } from '../src/orders/entities/orderItem.entity';
import { OrderHistory } from '../src/orders/entities/orderHistory.entity';
import { Pago } from '../src/orders/entities/pago.entity';

type InventoryServiceMock = {
    descontarStock: jest.Mock;
};

type KafkaServiceMock = {
    emitOrderStatusUpdated: jest.Mock;
    emitOrderProcessed: jest.Mock;
};

describe('OrdersController (integration) - confirmarOrden', () => {
    let app: INestApplication;
    let orderRepo: Repository<Order>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
            TypeOrmModule.forRoot({
                type: 'better-sqlite3',
                database: ':memory:',
                entities: [Order, OrderItem, OrderHistory, Pago],
                synchronize: true,
                dropSchema: true,
            }),
            OrdersModule,
            ],
        })
            
            .overrideProvider(InventoryService)
            .useValue({ descontarStock: jest.fn().mockResolvedValue({ status: 'STOCK_DESCONTADO'})})
            .overrideProvider(KafkaService)
            .useValue({ 
                emitOrderStatusUpdated: jest.fn(),
                emitOrderProcessed: jest.fn(),
            })
            .overrideProvider(PaymentsClient)
            .useValue({ procesarPago: jest.fn() })

            .overrideProvider(CatalogService)
            .useValue({ obtenerDetalles: jest.fn().mockResolvedValue({}) })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
        await app.init();

        orderRepo = app.get<Repository<Order>>(getRepositoryToken(Order));
    });

    beforeEach(() => {
        const inventoryService:InventoryServiceMock = app.get(InventoryService);
        inventoryService.descontarStock.mockReset();
        inventoryService.descontarStock.mockResolvedValue({ status: 'STOCK_DESCONTADO' });
    });

    it('debería devolver 404 si la orden no existe', async () => {
        await request(app.getHttpServer())
        .patch('/api/orders/uuid-inexistente/confirmar')
        .send({ usuario: 'admin-user-001' })
        .expect(404);
    });

    it('debería devolver 400 si la orden no está en estado PAGADO', async () => {
        const orden = orderRepo.create({
            orden_id: 'uuid-creado',
            usuarioId: 1,
            direccionEnvio: { ciudad: 'Lima' },
            costos: { subtotal: 100, impuestos: 18, envio: 0, total: 118 },
            entrega: { tipo: 'DOMICILIO' },
            metodoPago: 'SIMULADO',
            estado: EstadoOrden.CREADO,
            fechaCreacion: new Date(),
            num_orden: 1,
            codOrden: 'ORD-001',
        });
        await orderRepo.save(orden);

        await request(app.getHttpServer())
        .patch(`/api/orders/${orden.orden_id}/confirmar`)
        .send({ usuario: 'admin-user-001' })
        .expect(400);
    });

    it('debería devolver 503 si Inventario no responde', async () => {
        const orden = orderRepo.create({
            orden_id: 'uuid-inventario-error',
            usuarioId: 1,
            direccionEnvio: { ciudad: 'Lima' },
            costos: { subtotal: 100, impuestos: 18, envio: 0, total: 118 },
            entrega: { tipo: 'DOMICILIO' },
            metodoPago: 'SIMULADO',
            estado: EstadoOrden.PAGADO,
            fechaCreacion: new Date(),
            num_orden: 10,
            codOrden: 'ORD-010',
            items: [{ productoId: 1, cantidad: 2, precioUnitario: 50, subTotal: 100 }],
        });
        await orderRepo.save(orden);

        const inventoryService:InventoryServiceMock = app.get(InventoryService) ;
        inventoryService.descontarStock.mockRejectedValue(new Error('fallo'));

        await request(app.getHttpServer())
            .patch(`/api/orders/${orden.orden_id}/confirmar`)
            .send({ usuario: 'admin-user-001' })
            .expect(503);
    });

    it('debería devolver 400 si Inventario no confirma el descuento', async () => {
        const orden = orderRepo.create({
            orden_id: 'uuid-inventario-no-confirmado',
            usuarioId: 1,
            direccionEnvio: { ciudad: 'Lima' },
            costos: { subtotal: 100, impuestos: 18, envio: 0, total: 118 },
            entrega: { tipo: 'DOMICILIO' },
            metodoPago: 'SIMULADO',
            estado: EstadoOrden.PAGADO,
            fechaCreacion: new Date(),
            num_orden: 11,
            codOrden: 'ORD-011',
            items: [{ productoId: 1, cantidad: 2, precioUnitario: 50, subTotal: 100 }],
        });
        await orderRepo.save(orden);

        const inventoryService:InventoryServiceMock = app.get(InventoryService);
        inventoryService.descontarStock.mockResolvedValue({ status: 'ERROR' });

        await request(app.getHttpServer())
            .patch(`/api/orders/${orden.orden_id}/confirmar`)
            .send({ usuario: 'admin-user-001' })
            .expect(400);
    });


    it('debería confirmar la orden y luego procesarla ', async () => {
        const orden = orderRepo.create({
            orden_id: 'uuid-pagado-historial',
            usuarioId: 1,
            direccionEnvio: { ciudad: 'Lima' },
            costos: { subtotal: 100, impuestos: 18, envio: 0, total: 118 },
            entrega: { tipo: 'DOMICILIO' },
            metodoPago: 'SIMULADO',
            estado: EstadoOrden.PAGADO,
            fechaCreacion: new Date(),
            num_orden: 5,
            codOrden: 'ORD-005',
            items: [{ productoId: 1, cantidad: 2, precioUnitario: 50, subTotal: 100 }],
        });
        await orderRepo.save(orden);

        await request(app.getHttpServer())
            .patch(`/api/orders/${orden.orden_id}/confirmar`)
            .send({ usuario: 'admin-user-001' })
            .expect(200);

        // Estado final de la orden
        const ordenActualizada = await orderRepo.findOneOrFail({ where: { orden_id: orden.orden_id } });
        expect(ordenActualizada.estado).toBe(EstadoOrden.PROCESADO);

        // Validamos historial
        const historyRepo = app.get<Repository<OrderHistory>>(getRepositoryToken(OrderHistory));
        const historial = await historyRepo.find({ where: { orden_id: orden.orden_id } });

        // Debe existir un registro de CONFIRMADO
        expect(historial.some(h => h.estadoNuevo === EstadoOrden.CONFIRMADO.toString())).toBe(true);

        // Debe existir un registro de PROCESADO
        expect(historial.some(h => h.estadoNuevo === EstadoOrden.PROCESADO.toString())).toBe(true);

        // Validamos que se llamó a inventario
        const inventoryService: InventoryServiceMock = app.get(InventoryService) ;
        expect(inventoryService.descontarStock).toHaveBeenCalled();
        // Validamos que se emitieron eventos Kafka
        const kafkaService : KafkaServiceMock = app.get(KafkaService)  ;
        expect((kafkaService.emitOrderStatusUpdated)).toHaveBeenCalledWith(expect.objectContaining({
            eventType: 'ORDEN_CONFIRMADA',
        }));
        expect((kafkaService.emitOrderProcessed )).toHaveBeenCalledWith(expect.objectContaining({
            eventType: 'ORDEN_PROCESADA',
        }));
    });

});
