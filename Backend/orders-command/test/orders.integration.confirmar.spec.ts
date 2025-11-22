import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrdersModule } from '../src/orders/orders.module';
import { OrderMock } from './entities/order.mock.entity';
import { OrderItemMock } from './entities/orderItem.mock.entity';
import { OrderHistoryMock } from './entities/orderHistory.mock.entity';
import { PagoMock } from './entities/pago.mock.entity';
import { EstadoOrden } from '../src/orders/enums/estado-orden.enum';
import { InventoryService } from '../src/orders/inventory/inventory.service';
import { KafkaService } from '../src/kafka/kafka.service';
import { PaymentsClient } from '../src/orders/payments/payments.service';
import { CatalogService } from '../src/orders/catalog/catalog.service';

import { Order } from '../src/orders/entities/order.entity';
import { OrderItem } from '../src/orders/entities/orderItem.entity';
import { OrderHistory } from '../src/orders/entities/orderHistory.entity';
import { Pago } from '../src/orders/entities/pago.entity';

describe('OrdersController (integration) - confirmarOrden', () => {
    let app: INestApplication;
    let orderRepo: Repository<Order>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
            TypeOrmModule.forRoot({
                type: 'sqlite',
                database: ':memory:',
                entities: [OrderMock, OrderItemMock, OrderHistoryMock, PagoMock],
                synchronize: true,
            }),
            OrdersModule,
            ],
        })
            .overrideProvider(getRepositoryToken(Order))
            .useFactory({
            factory: (dataSource: DataSource) => dataSource.getRepository(OrderMock),
            inject: [DataSource],
            })
            .overrideProvider(getRepositoryToken(OrderItem))
            .useFactory({
            factory: (dataSource: DataSource) => dataSource.getRepository(OrderItemMock),
            inject: [DataSource],
            })
            .overrideProvider(getRepositoryToken(OrderHistory))
            .useFactory({
            factory: (dataSource: DataSource) => dataSource.getRepository(OrderHistoryMock),
            inject: [DataSource],
            })
            .overrideProvider(getRepositoryToken(Pago))
            .useFactory({
            factory: (dataSource: DataSource) => dataSource.getRepository(PagoMock),
            inject: [DataSource],
            })
            .overrideProvider(InventoryService)
            .useValue({ descontarStock: jest.fn().mockResolvedValue({ status: 'STOCK_DESCONTADO' }) })
            .overrideProvider(KafkaService)
            .useValue({ emitOrderStatusUpdated: jest.fn() })
            .overrideProvider(PaymentsClient)
            .useValue({ procesarPago: jest.fn().mockResolvedValue({ 
                    pago_id: 'mock-pago-123',
                    metodoPago: 'SIMULADO',
                    status: 'PAGO_EXITOSO',
                    fecha_pago: new Date().toISOString(),
                    datosPago: { referencia: 'mock-ref' }
                }) 
            })
            .overrideProvider(CatalogService)
            .useValue({ obtenerDetalles: jest.fn().mockResolvedValue({}) })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
        await app.init();

        orderRepo = app.get<Repository<OrderMock>>(getRepositoryToken(Order));
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

    it('debería confirmar la orden si está en estado PAGADO', async () => {
        const orden = orderRepo.create({
        orden_id: 'uuid-pagado',
        usuarioId: 1,
        direccionEnvio: { ciudad: 'Lima' },
        costos: { subtotal: 100, impuestos: 18, envio: 0, total: 118 },
        entrega: { tipo: 'DOMICILIO' },
        metodoPago: 'SIMULADO',
        estado: EstadoOrden.PAGADO,
        fechaCreacion: new Date(),
        num_orden: 2,
        codOrden: 'ORD-002',
        });
        await orderRepo.save(orden);

    await request(app.getHttpServer())
        .patch(`/api/orders/${orden.orden_id}/confirmar`)
        .send({ usuario: 'admin-user-001' })
        .expect(200);

    const ordenActualizada = await orderRepo.findOneOrFail({ where: { orden_id: orden.orden_id } });
    expect(ordenActualizada.estado).toBe(EstadoOrden.CONFIRMADO);

    });
});
