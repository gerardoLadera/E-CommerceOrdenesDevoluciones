import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';   
import { OrdersModule } from '../src/orders/orders.module';
import { MongoService } from '../src/mongo/mongo.service';

const mockCollection = { find: jest.fn(), countDocuments: jest.fn() };
const mongoService = { getCollection: jest.fn().mockReturnValue(mockCollection) };

describe('GET /api/orders/usuario/:usuarioId (integration)', () => {
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

    it('debe devolver lista de órdenes del usuario', async () => {
        const fakeDocs = [{ _id: 'abc', cod_orden: 'ORD-001', estado: 'PROCESADO', fechaCreacion: new Date() }];
        const cursorMock: any = {};
        cursorMock.project = () => cursorMock;
        cursorMock.sort = () => cursorMock;
        cursorMock.skip = () => cursorMock;
        cursorMock.limit = () => cursorMock;
        cursorMock.toArray = jest.fn().mockResolvedValue(fakeDocs);

        mockCollection.find.mockReturnValue(cursorMock);
        mockCollection.countDocuments.mockResolvedValue(1);

        const res = await request(app.getHttpServer())
        .get('/api/orders/usuario/123?page=1&limit=5')
        .expect(200);

        expect(res.body.data[0].cod_orden).toBe('ORD-001');
    });

    it('debe devolver lista vacía si el usuario no tiene órdenes', async () => {
        const cursorMock: any = {};
        cursorMock.project = () => cursorMock;
        cursorMock.sort = () => cursorMock;
        cursorMock.skip = () => cursorMock;
        cursorMock.limit = () => cursorMock;
        cursorMock.toArray = jest.fn().mockResolvedValue([]);

        mockCollection.find.mockReturnValue(cursorMock);
        mockCollection.countDocuments.mockResolvedValue(0);

        const res = await request(app.getHttpServer())
        .get('/api/orders/usuario/999?page=1&limit=5')
        .expect(200);

        expect(res.body.data).toEqual([]);
    });

    it('debe respetar la paginación', async () => {
        const cursorMock: any = {};
        cursorMock.project = () => cursorMock;
        cursorMock.sort = () => cursorMock;
        cursorMock.skip = jest.fn().mockReturnValue(cursorMock);
        cursorMock.limit = jest.fn().mockReturnValue(cursorMock);
        cursorMock.toArray = jest.fn().mockResolvedValue([]);

        mockCollection.find.mockReturnValue(cursorMock);
        mockCollection.countDocuments.mockResolvedValue(10);

        await request(app.getHttpServer())
        .get('/api/orders/usuario/123?page=2&limit=5')
        .expect(200);

        expect(cursorMock.skip).toHaveBeenCalledWith(5);
    });
});
