import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrdersModule } from '../src/orders/orders.module';
import { Order } from '../src/orders/entities/order.entity';
import { OrderItem } from '../src/orders/entities/orderItem.entity';
import { OrderHistory } from '../src/orders/entities/orderHistory.entity';
import { Pago } from '../src/orders/entities/pago.entity';
import { InventoryService } from '../src/orders/inventory/inventory.service';
import { CatalogService } from '../src/orders/catalog/catalog.service';
import { PaymentsClient } from '../src/orders/payments/payments.service';


//  Uso de entidades mock en lugar de las reales
import { OrderMock } from './entities/order.mock.entity';
import { OrderItemMock } from './entities/orderItem.mock.entity';
import { OrderHistoryMock } from './entities/orderHistory.mock.entity';
import { PagoMock } from './entities/pago.mock.entity';


describe('OrdersController (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleBuilder = Test.createTestingModule({
        imports: [
            TypeOrmModule.forRoot({
            type: 'sqlite',
            database: ':memory:',
            entities: [
                OrderMock, OrderItemMock, OrderHistoryMock, PagoMock
            ],
            synchronize: true,
            }),
            OrdersModule,
        ],
        })
        .overrideProvider('KAFKA_SERVICE')
        .useValue({ emit: jest.fn(), send: jest.fn(), connect: jest.fn(), close: jest.fn() })

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
        .useValue({
        reserveStock: jest.fn().mockResolvedValue({ success: true })
        })
        .overrideProvider(CatalogService)
        .useValue({
        obtenerDetalles: jest.fn().mockResolvedValue({})
        })
        .overrideProvider(PaymentsClient)
        .useValue({
        procesarPago: jest.fn().mockResolvedValue({
            pago_id: 'mock-pago-123',
            metodoPago: 'SIMULADO',
            status: 'PAGO_EXITOSO',
            fecha_pago: new Date().toISOString(),
            datosPago: { referencia: 'mock-ref' }
        })
        });

    const moduleFixture: TestingModule = await moduleBuilder.compile();
        

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('debería crear una orden con RECOJO_TIENDA', async () => {
        const payload = {
        usuarioId: 123,
        direccionEnvio: {
            nombreCompleto: "Juan Pérez",
            telefono: "+51 987654321",
            direccionLinea1: "Av. Siempre Viva 742",
            ciudad: "Lima",
            provincia: "Lima",
            codigoPostal: "15001",
            pais: "Perú"
        },
        items: [
            { productoId: 4 ,nombreProducto: "Camisa Negra ", cantidad: 1, precioUnitario: 50.0, subTotal: 100.0 }
        ],
        costos: { subtotal: 100.0, impuestos: 18.0, envio: 0.0, total: 118.0 },
        entrega: {
            tipo: "RECOJO_TIENDA",
            almacenOrigen: { id: 2, nombre: "Almacén Cusco", direccion: "Av. El Sol 456", latitud: -13.5319, longitud: -71.9675 },
            tiendaSeleccionada: { id: 4, nombre: "Tienda Surco Mall", direccion: "Av. Primavera 890", latitud: -12.145, longitud: -77.01 },
            costoEnvio: 0.0,
            tiempoEstimadoDias: 0,
            fechaEntregaEstimada: "2025-11-08T08:00:18.931Z",
            descripcion: "Recoge tu pedido en tienda sin costo adicional"
        },
        metodoPago: "SIMULADO",
        estadoInicial: "PENDIENTE"
        };

        const response = await request(app.getHttpServer())
        .post('/api/orders')
        .send(payload)
        .expect(201);

        expect(response.body).toHaveProperty('orden_id');
        expect(response.body.estado).toBe('CREADO');
    });
});
