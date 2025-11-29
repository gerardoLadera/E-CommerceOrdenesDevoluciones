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


    type KafkaServiceMock = {
        emitOrderDelivered: jest.Mock;
    };

    describe('OrdersController (integration) - entregarOrden', () => {
    let app: INestApplication;
    let orderRepo: Repository<Order>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
            TypeOrmModule.forRoot({
            type: 'sqlite',
            database: ':memory:',
            entities: [Order, OrderItem, OrderHistory, Pago],
            synchronize: true,
            }),
            OrdersModule,
        ],
        })
        
        .overrideProvider(InventoryService)
        .useValue({ descontarStock: jest.fn() })
        .overrideProvider(KafkaService)
        .useValue({
            emitOrderDelivered: jest.fn(),
        })
        .overrideProvider(PaymentsClient)
        .useValue({ procesarPago: jest.fn() })
        .overrideProvider(CatalogService)
        .useValue({ obtenerDetalles: jest.fn() })
        .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
        await app.init();

        orderRepo = app.get<Repository<Order>>(getRepositoryToken(Order));
    });

    it('debería devolver 404 si la orden no existe', async () => {
        await request(app.getHttpServer())
        .patch('/api/orders/999/entregar')
        .send({ mensaje: 'Entrega simulada' })
        .expect(404);
    });

    it('debería devolver 400 si la orden ya está ENTREGADA', async () => {
    const orden = orderRepo.create({
        orden_id: 'uuid-entregada',
        num_orden: 12,
        usuarioId: 1,
        direccionEnvio: { ciudad: 'Lima' },
        costos: { subtotal: 100, envio: 0, total: 118 },
        entrega: { tipo: 'DOMICILIO' },
        metodoPago: 'SIMULADO',
        estado: EstadoOrden.ENTREGADO, 
        fechaCreacion: new Date(),
        codOrden: 'ORD-002',
        items: [],
    });
    await orderRepo.save(orden);

    await request(app.getHttpServer())
        .patch(`/api/orders/${orden.num_orden}/entregar`)
        .send({ mensaje: 'Intento duplicado de entrega' })
        .expect(400);
    });

    it('debería devolver 400 si la orden no está en estado PROCESADO', async () => {
        const orden = orderRepo.create({
        orden_id: 'uuid-no-procesado',
        num_orden: 10,
        usuarioId: 1,
        direccionEnvio: { ciudad: 'Lima' },
        costos: { subtotal: 100, envio: 0, total: 118 },
        entrega: { tipo: 'DOMICILIO' },
        metodoPago: 'SIMULADO',
        estado: EstadoOrden.PAGADO, 
        fechaCreacion: new Date(),
        codOrden: 'ORD-001',
        items: [],
        });
        await orderRepo.save(orden);

        await request(app.getHttpServer())
        .patch(`/api/orders/${orden.num_orden}/entregar`)
        .send({ mensaje: 'Entrega simulada' })
        .expect(400);
    });

    it('debería marcar la orden como ENTREGADA y emitir evento Kafka', async () => {
        const orden = orderRepo.create({
        orden_id: 'uuid-procesado',
        num_orden: 11,
        usuarioId: 1,
        direccionEnvio: { ciudad: 'Lima' },
        costos: { subtotal: 100, envio: 0, total: 118 },
        entrega: { tipo: 'DOMICILIO' },
        metodoPago: 'SIMULADO',
        estado: EstadoOrden.PROCESADO, 
        fechaCreacion: new Date(),
        codOrden: 'ORD-001',
        items: [],
        });
        await orderRepo.save(orden);

        await request(app.getHttpServer())
        .patch(`/api/orders/${orden.num_orden}/entregar`)
        .send({ mensaje: 'Cliente recibió el paquete' })
        .expect(200);

        // Estado final de la orden
        const ordenActualizada = await orderRepo.findOneOrFail({ where: { orden_id: orden.orden_id } });
        expect(ordenActualizada.estado).toBe(EstadoOrden.ENTREGADO);

        // Validamos historial
        const historyRepo = app.get<Repository<OrderHistory>>(getRepositoryToken(OrderHistory));
        const historial = await historyRepo.find({ where: { orden_id: orden.orden_id } });
        expect(historial.some(h => h.estadoNuevo === EstadoOrden.ENTREGADO.toString())).toBe(true);

        // Validamos que se emitió evento Kafka
        const kafkaService: KafkaServiceMock = app.get(KafkaService);
        expect(kafkaService.emitOrderDelivered).toHaveBeenCalledWith(
        expect.objectContaining({
            eventType: 'ORDEN_ENTREGADA',
            data: expect.objectContaining({
            orden_id: orden.orden_id,
            estadoNuevo: EstadoOrden.ENTREGADO,
            }),
        }),
        );
    });
});
