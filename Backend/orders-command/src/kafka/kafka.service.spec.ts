import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from './kafka.service';
import { ClientKafka } from '@nestjs/microservices';

describe('KafkaService (unit)', () => {
    let service: KafkaService;
    let kafkaClient: ClientKafka;

    beforeEach(async () => {
        const mockKafkaClient = {
        connect: jest.fn().mockResolvedValue(undefined),
        emit: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
        providers: [
            KafkaService,
            {
            provide: 'KAFKA_SERVICE',
            useValue: mockKafkaClient,
            },
        ],
        }).compile();

        service = module.get<KafkaService>(KafkaService);
        kafkaClient = module.get<ClientKafka>('KAFKA_SERVICE');
    });

    it('debería conectar el cliente Kafka en onModuleInit', async () => {
        await service.onModuleInit();
        expect(kafkaClient.connect).toHaveBeenCalled();
    });

    it('debería emitir evento order-created', async () => {
        const payload = { id: 1 };
        await service.emitOrderCreated(payload);
        expect(kafkaClient.emit).toHaveBeenCalledWith('order-created', payload);
    });

    it('debería emitir evento order-cancelled', async () => {
        const payload = { id: 2 };
        await service.emitOrderCancelled(payload);
        expect(kafkaClient.emit).toHaveBeenCalledWith('order-cancelled', payload);
    });

    it('debería emitir evento order-paid', async () => {
        const payload = { id: 3 };
        await service.emitOrderPaid(payload);
        expect(kafkaClient.emit).toHaveBeenCalledWith('order-paid', payload);
    });

    it('debería emitir evento order-confirmed', async () => {
        const payload = { id: 4 };
        await service.emitOrderStatusUpdated(payload);
        expect(kafkaClient.emit).toHaveBeenCalledWith('order-confirmed', payload);
    });

    it('debería emitir evento order-processed', async () => {
        const payload = { id: 5 };
        await service.emitOrderProcessed(payload);
        expect(kafkaClient.emit).toHaveBeenCalledWith('order-processed', payload);
    });

    it('debería emitir evento order-delivered', async () => {
        const payload = { id: 6 };
        await service.emitOrderDelivered(payload);
        expect(kafkaClient.emit).toHaveBeenCalledWith('order-delivered', payload);
    });
});
