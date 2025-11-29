import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest'; 
import { OrdersModule } from '../src/orders/orders.module';
import { MongoService } from '../src/mongo/mongo.service';

const mockCollection = { find: jest.fn(), countDocuments: jest.fn() };
const mongoService = { getCollection: jest.fn().mockReturnValue(mockCollection) };

describe('GET /api/orders (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [OrdersModule],
        })
        .overrideProvider(MongoService)
        .useValue(mongoService)
        .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true ,transform: true,}));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('debe devolver lista general sin filtros', async () => {
        const fakeDocs = [{ _id: 'xyz', cod_orden: 'ORD-002', direccionEnvio: { nombreCompleto: 'Cliente Demo' }, estado: 'ENTREGADO', costos: { total: 200 } }];
        const cursorMock = { project: () => cursorMock, sort: () => cursorMock, skip: () => cursorMock, limit: () => cursorMock, toArray: jest.fn().mockResolvedValue(fakeDocs) };
        mockCollection.find.mockReturnValue(cursorMock);
        mockCollection.countDocuments.mockResolvedValue(1);

        const res = await request(app.getHttpServer()).get('/api/orders?page=1&limit=9').expect(200);
        expect(res.body.data[0].cod_orden).toBe('ORD-002');
    });

    it('debe aplicar filtros (estado)', async () => {
        const cursorMock = { project: () => cursorMock, sort: () => cursorMock, skip: () => cursorMock, limit: () => cursorMock, toArray: jest.fn().mockResolvedValue([]) };
        mockCollection.find.mockImplementation(query => {
        expect(query.estado).toBe('ENTREGADO');
        return cursorMock;
        });
        mockCollection.countDocuments.mockResolvedValue(0);

        await request(app.getHttpServer()).get('/api/orders?page=1&limit=9&estado=ENTREGADO').expect(200);
    });

    it('debe devolver lista vacía si no hay coincidencias', async () => {
        const cursorMock = { project: () => cursorMock, sort: () => cursorMock, skip: () => cursorMock, limit: () => cursorMock, toArray: jest.fn().mockResolvedValue([]) };
        mockCollection.find.mockReturnValue(cursorMock);
        mockCollection.countDocuments.mockResolvedValue(0);

        const res = await request(app.getHttpServer()).get('/api/orders?page=1&limit=9&busquedaId=ORD-999').expect(200);
        expect(res.body.data).toEqual([]);
    });
});
