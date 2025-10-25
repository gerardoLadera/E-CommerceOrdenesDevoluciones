import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { ClientKafka } from '@nestjs/microservices';
import { AppModule } from '../src/app.module';

describe('Devolución - Notificación al Cliente (e2e)', () => {
  let app: INestApplication;
  let kafkaClient: ClientKafka;
  
  const mockKafkaClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
    close: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('NOTIFICATIONS_SERVICE')
      .useValue(mockKafkaClient)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    kafkaClient = moduleFixture.get<ClientKafka>('NOTIFICATIONS_SERVICE');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /devolucion - Verificar notificación al crear devolución', () => {
    it('should create a return and emit notification event to Kafka', async () => {
      const createDevolucionDto = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        estado: 'pendiente',
        fecha_procesamiento: '2025-01-15T10:30:00Z',
      };

      // Mock del servicio de órdenes (si es necesario)
      // Este test asume que el OrderService está mockeado o la orden existe

      const response = await request(app.getHttpServer())
        .post('/devolucion')
        .send(createDevolucionDto)
        .expect(201);

      // Verificar que la devolución se creó
      expect(response.body).toHaveProperty('id');
      expect(response.body.orderId).toBe(createDevolucionDto.orderId);

      // 🎯 VERIFICACIÓN CLAVE: El evento se emitió a Kafka
      expect(kafkaClient.emit).toHaveBeenCalledTimes(1);
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        'return-created',
        expect.objectContaining({
          eventType: 'return-created',
          data: expect.objectContaining({
            orderId: createDevolucionDto.orderId,
          }),
          timestamp: expect.any(String),
        }),
      );
    });

    it('should include customer information in notification event', async () => {
      const createDevolucionDto = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        estado: 'pendiente',
      };

      await request(app.getHttpServer())
        .post('/devolucion')
        .send(createDevolucionDto)
        .expect(201);

      // Verificar que el evento contiene información para notificar al cliente
      const emitCall = (kafkaClient.emit as jest.Mock).mock.calls[0];
      const eventPayload = emitCall[1];

      expect(eventPayload).toHaveProperty('eventType', 'return-created');
      expect(eventPayload).toHaveProperty('data');
      expect(eventPayload).toHaveProperty('timestamp');
      
      // El payload debe contener los datos de la devolución
      expect(eventPayload.data).toHaveProperty('orderId');
      expect(eventPayload.data).toHaveProperty('estado');
    });

    it('should not emit event if order does not exist', async () => {
      const createDevolucionDto = {
        orderId: 'nonexistent-order-id',
        estado: 'pendiente',
      };

      await request(app.getHttpServer())
        .post('/devolucion')
        .send(createDevolucionDto)
        .expect(404); // Not Found

      // No debe emitir evento si la orden no existe
      expect(kafkaClient.emit).not.toHaveBeenCalled();
    });
  });

  describe('Verificar estructura del evento de notificación', () => {
    it('should emit event with correct structure for notification service', async () => {
      const createDevolucionDto = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        estado: 'pendiente',
      };

      await request(app.getHttpServer())
        .post('/devolucion')
        .send(createDevolucionDto)
        .expect(201);

      const emitCall = (kafkaClient.emit as jest.Mock).mock.calls[0];
      const [topic, payload] = emitCall;

      // Verificar topic correcto
      expect(topic).toBe('return-created');

      // Verificar estructura del payload
      expect(payload).toMatchObject({
        eventType: 'return-created',
        data: expect.any(Object),
        timestamp: expect.any(String),
      });

      // Verificar que timestamp es válido
      const timestamp = new Date(payload.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });
});
