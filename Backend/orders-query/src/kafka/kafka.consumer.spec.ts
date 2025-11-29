// src/kafka/kafka.consumer.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { KafkaConsumerService } from './kafka.consumer';
import { MongoService } from '../mongo/mongo.service';
import { OrdersService } from '../orders/orders.service';

// --- MOCKS CENTRALES ---

// Mocks de las colecciones de MongoDB: Usados para simular la BD
const mockOrdenesCollection = {
  insertOne: jest.fn(),
  updateOne: jest.fn(),
};
const mockDevolucionesCollection = {
  insertOne: jest.fn(),
};

// Mock del MongoService: Asegura que cada colección apunte al mock correcto
const mockMongoService = {
  getCollection: jest.fn((name: string) => {
    if (name === 'ordenes') {
      return mockOrdenesCollection;
    }
    if (name === 'devoluciones') {
      return mockDevolucionesCollection;
    }
    // Retornar el mock de ordenes por defecto para el resto de handlers
    return mockOrdenesCollection;
  }),
};

// Mock del OrdersService: Necesario para el constructor y la lógica de devoluciones (ECO-118)
const mockOrdersService = {
  updateOrderFlagForReturnNew: jest
    .fn()
    .mockResolvedValue({ modifiedCount: 1 }),
};

describe('KafkaConsumerService - Handlers de Órdenes y Devoluciones', () => {
  let service: KafkaConsumerService;
  let ordersService: OrdersService;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Configuración del módulo de pruebas con todas las dependencias
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaConsumerService,
        {
          provide: MongoService,
          useValue: mockMongoService,
        },
        {
          // Dependencia crítica para la lógica de devolución
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    service = module.get<KafkaConsumerService>(KafkaConsumerService);
    ordersService = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();

    // Espiar console.error para validaciones de fallo
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- REPLICACIÓN DE ORDENES (INSERCIÓN) ---

  it('handleOrderCreated debe replicar orden en la colección "ordenes"', async () => {
    const payload = {
      data: {
        orden_id: 'abc',
        num_orden: 1,
        cod_Orden: 'ORD-001',
        estado: 'CREADA',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        orden_items: [], // El resto de campos omitidos por brevedad
      },
    };

    await service.handleOrderCreated(payload);

    // Se usa mockOrdenesCollection (vía getCollection)
    expect(mockOrdenesCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'abc', estado: 'CREADA', num_orden: 1 }),
    );
    expect(mockMongoService.getCollection).toHaveBeenCalledWith('ordenes');
  });

  it('handleOrderCancelled debe replicar orden CANCELADA en la colección "ordenes"', async () => {
    const payload = {
      data: {
        orden_id: 'def',
        num_orden: 2,
        cod_Orden: 'ORD-002',
        estado: 'CANCELADA',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
      },
    };

    await service.handleOrderCancelled(payload);

    // Se usa mockOrdenesCollection (vía getCollection)
    expect(mockOrdenesCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'def',
        estado: 'CANCELADA',
        num_orden: 2,
      }),
    );
  });

  // --- ACTUALIZACIÓN DE ORDENES (UPDATE) ---

  it('handleOrderPaid debe actualizar orden como PAGADA en la colección "ordenes"', async () => {
    const payload = {
      data: {
        orden_id: 'ghi',
        estadoNuevo: 'PAGADA',
        fechaActualizacion: new Date().toISOString(),
        pago: { estado: 'COMPLETADO' },
        historialNuevo: { estadoNuevo: 'PAGADA' },
      },
    };

    await service.handleOrderPaid(payload);

    // Se usa mockOrdenesCollection (vía getCollection)
    expect(mockOrdenesCollection.updateOne).toHaveBeenCalledWith(
      { _id: 'ghi' },
      expect.objectContaining({
        $set: expect.objectContaining({ estado: 'PAGADA' }),
        $push: expect.any(Object),
      }),
      { upsert: false },
    );
  });

  it('handleOrderConfirmed debe actualizar orden como CONFIRMADA en la colección "ordenes"', async () => {
    const payload = {
      data: {
        orden_id: 'jkl',
        estadoNuevo: 'CONFIRMADA',
        fechaActualizacion: new Date().toISOString(),
        historialNuevo: { estadoNuevo: 'CONFIRMADA' },
      },
    };

    await service.handleOrderConfirmed(payload);

    expect(mockOrdenesCollection.updateOne).toHaveBeenCalledWith(
      { _id: 'jkl' },
      expect.objectContaining({
        $set: expect.objectContaining({ estado: 'CONFIRMADA' }),
      }),
      { upsert: false },
    );
  });

  // --- TESTS PARA DEVOLUCIONES (ECO-118/119/120) ---

  describe('handleReturnCreated (ECO-118/119/120)', () => {
    const mockReturnEventData = {
      orderId: '0d117dd2-8d16-4b1d-b4e9-d21361648724',
      returnId: '5ef44abe-12e1-4a6a-add1-6cca752e3b36',
      status: 'pendiente',
      createdAt: new Date().toISOString(),
      reason: 'Producto incorrecto',
      requestedBy: 'usuario_prueba',
      returnedItems: [
        {
          itemId: 'item-1',
          quantity: 1,
          action: 'reemplazo',
          purchasePrice: 100.0,
        },
      ],
    };

    it('debe actualizar la orden (ECO-118) e insertar la devolución (ECO-119)', async () => {
      await service.handleReturnCreated({ data: mockReturnEventData });

      // 1. Verificar la actualización de la orden (Llamada al OrdersService)
      expect(ordersService.updateOrderFlagForReturnNew).toHaveBeenCalledWith(
        mockReturnEventData.orderId,
        mockReturnEventData.returnId,
      );

      // 2. Verificar la inserción del documento de devolución
      expect(mockDevolucionesCollection.insertOne).toHaveBeenCalledTimes(1);

      // 3. Verificar el mapeo correcto del documento insertado (ECO-119)
      const insertedDocument =
        mockDevolucionesCollection.insertOne.mock.calls[0][0];

      expect(insertedDocument.orden_id).toBe(mockReturnEventData.orderId);
      expect(insertedDocument.tipo).toBe('REEMPLAZO');
      expect(insertedDocument.items_afectados).toHaveLength(1);
      expect(mockMongoService.getCollection).toHaveBeenCalledWith(
        'devoluciones',
      );
    });

    it('NO debe procesar si el array de returnedItems está vacío (Validación ECO-120)', async () => {
      const invalidPayload = {
        data: { returnId: '123', orderId: 'ORD-456', returnedItems: [] },
      };

      await service.handleReturnCreated(invalidPayload);

      // Verificamos que NUNCA se llama al servicio ni a la BD
      expect(ordersService.updateOrderFlagForReturnNew).not.toHaveBeenCalled();
      expect(mockDevolucionesCollection.insertOne).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('no contiene ítems afectados.'),
      );
    });
  });
});
