import { Test, type TestingModule } from '@nestjs/testing';
import type { ClientKafka } from '@nestjs/microservices';
import { KafkaProducerService } from './kafkaprovider.service';

describe('KafkaProducerService', () => {
  let service: KafkaProducerService;
  let kafkaClient: ClientKafka;

  const mockKafkaClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
    close: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaProducerService,
        {
          provide: 'NOTIFICATIONS_SERVICE',
          useValue: mockKafkaClient,
        },
      ],
    }).compile();

    service = module.get<KafkaProducerService>(KafkaProducerService);
    kafkaClient = module.get<ClientKafka>('NOTIFICATIONS_SERVICE');

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should connect to Kafka on module initialization', async () => {
      await service.onModuleInit();

      expect(kafkaClient.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('emitReturnCreated', () => {
    it('should emit return-created event with correct payload', async () => {
      const eventPayload = {
        eventType: 'return-created',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          orderId: 'order-123',
          estado: 'pendiente',
        },
        timestamp: new Date().toISOString(),
      };

      await service.emitReturnCreated(eventPayload);

      expect(kafkaClient.emit).toHaveBeenCalledTimes(1);
      expect(kafkaClient.emit).toHaveBeenCalledWith('return-created', eventPayload);
    });

    it('should emit event with customer notification data', async () => {
      const eventPayload = {
        eventType: 'return-created',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          orderId: 'order-123',
          customerId: 'customer-456',
          customerEmail: 'customer@example.com',
          estado: 'pendiente',
        },
        timestamp: '2025-01-15T10:30:00Z',
      };

      await service.emitReturnCreated(eventPayload);

      expect(kafkaClient.emit).toHaveBeenCalledWith('return-created', eventPayload);
      
      // Verificar que el payload contiene los datos necesarios para la notificación
      const emittedPayload = (kafkaClient.emit as jest.Mock).mock.calls[0][1];
      expect(emittedPayload.data).toHaveProperty('customerId');
      expect(emittedPayload.data).toHaveProperty('customerEmail');
    });
  });

  describe('emitReturnCancelled', () => {
    it('should emit return-cancelled event', async () => {
      const eventPayload = {
        eventType: 'return-cancelled',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          reason: 'Customer request',
        },
        timestamp: new Date().toISOString(),
      };

      await service.emitReturnCancelled(eventPayload);

      expect(kafkaClient.emit).toHaveBeenCalledWith('return-cancelled', eventPayload);
    });
  });

  describe('returnPaid', () => {
    it('should emit return-paid event', async () => {
      const eventPayload = {
        eventType: 'return-paid',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          amount: 100.50,
          currency: 'USD',
        },
        timestamp: new Date().toISOString(),
      };

      await service.returnPaid(eventPayload);

      expect(kafkaClient.emit).toHaveBeenCalledWith('return-paid', eventPayload);
    });
  });
});
