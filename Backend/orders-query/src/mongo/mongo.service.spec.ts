import { MongoService } from './mongo.service';
import { ConfigService } from '@nestjs/config';
import { MongoClient } from 'mongodb';

jest.mock('mongodb', () => {
    return {
        MongoClient: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(true),
        db: jest.fn().mockReturnValue({
            collection: jest.fn().mockReturnValue({ name: 'fakeCollection' }),
        }),
        })),
    };
    });

    describe('MongoService', () => {
    let service: MongoService;
    let configService: ConfigService;

    beforeEach(() => {
        configService = { get: jest.fn() } as any;
        service = new MongoService(configService);
    });

    it('debe conectar a MongoDB si MONGO_URI está definido', async () => {
        (configService.get as jest.Mock).mockReturnValue('mongodb://localhost:27017/test');

        await service.onModuleInit();

        expect(MongoClient).toHaveBeenCalledWith('mongodb://localhost:27017/test');
        expect(service.db).toBeDefined();

        const collection = service.getCollection('ordenes');
        expect(collection).toEqual({ name: 'fakeCollection' });
    });

    it('debe lanzar error si MONGO_URI no está definido', async () => {
        (configService.get as jest.Mock).mockReturnValue(undefined);

        await expect(service.onModuleInit()).rejects.toThrow(' MONGO_URI no está definida en el entorno');
    });
});
