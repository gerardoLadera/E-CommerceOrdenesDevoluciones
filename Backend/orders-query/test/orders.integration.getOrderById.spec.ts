import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest'; 
import { OrdersModule } from '../src/orders/orders.module';
import { MongoService } from '../src/mongo/mongo.service';

const mockCollection = { findOne: jest.fn() };
const mongoService = { getCollection: jest.fn().mockReturnValue(mockCollection) };

describe('GET /api/orders/:id (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [OrdersModule],
        })
        .overrideProvider(MongoService)
        .useValue(mongoService)
        .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('debe devolver detalle de la orden si existe', async () => {
        const fakeOrder = { _id: 'abc', cod_orden: 'ORD-001', estado: 'PROCESADO' };
        mockCollection.findOne.mockResolvedValue(fakeOrder);

        const res = await request(app.getHttpServer()).get('/api/orders/abc').expect(200);
        expect(res.body._id).toBe('abc');
    });

    it('debe devolver 404 si la orden no existe', async () => {
        mockCollection.findOne.mockResolvedValue(null);

        const res = await request(app.getHttpServer()).get('/api/orders/no-existe').expect(404);
        expect(res.body.message).toContain('Orden con ID no-existe no encontrada');
    });
});
