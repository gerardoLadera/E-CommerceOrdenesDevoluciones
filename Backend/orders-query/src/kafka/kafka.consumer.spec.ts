// orders-query/src/kafka/kafka.consumer.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { KafkaConsumerService } from './kafka.consumer';
import { MongoService } from '../mongo/mongo.service';

// Mock del objeto de colección de MongoDB
const mockCollection = {
  // Simula el método updateOne de MongoDB.
  updateOne: jest.fn(),
  // ⬅️ AÑADIDO: Mock para el método insertOne
  insertOne: jest.fn(),
};

// Mock del MongoService
const mockMongoService = {
  getCollection: jest.fn(() => mockCollection),
};

describe('KafkaConsumerService (Devoluciones)', () => {
  let service: KafkaConsumerService;
  let mongoService: MongoService;

  beforeEach(async () => {
    // Configuración del módulo de pruebas
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaConsumerService,
        {
          provide: MongoService,
          useValue: mockMongoService, // Usamos el mock
        },
      ],
    }).compile();

    service = module.get<KafkaConsumerService>(KafkaConsumerService);
    mongoService = module.get<MongoService>(MongoService);

    // Limpiar todos los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // PRUEBAS PARA ECO-118/119: handleReturnCreated
  describe('handleReturnCreated', () => {
    const mockReturnEventData = {
      orderId: '0d117dd2-8d16-4b1d-b4e9-d21361648724',
      returnId: '5ef44abe-12e1-4a6a-add1-6cca752e3b36',
      type: 'REEMBOLSO', // Campo real del payload
      status: 'pendiente', // Campo real del payload
      createdAt: new Date().toISOString(), // Usar string ISO para simular Kafka
      reason: 'Producto incorrecto',
      returnedItems: [{ id: 'item-1', quantity: 1 }], // Campo real del payload
      // Incluir campos opcionales para la prueba de mapeo
      reimbursementDetails: { id: 'reemb-123' },
    };

    it('should successfully update the order in MongoDB with return fields', async () => {
      // Configuramos el mock para simular que 1 documento fue modificado (éxito)
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await service.handleReturnCreated({ data: mockReturnEventData });

      // 1. Verificamos que se llamó a la colección 'ordenes'
      expect(mongoService.getCollection).toHaveBeenCalledWith('ordenes');

      // 2. Verificamos que updateOne fue llamado
      expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);

      // 3. Verificamos que updateOne fue llamado con los argumentos correctos
      const expectedQuery = { _id: mockReturnEventData.orderId };
      const expectedUpdate = {
        $set: {
          hasActiveReturn: true,
          lastReturnId: mockReturnEventData.returnId,
        },
      };

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        expectedQuery,
        expectedUpdate,
        { upsert: false }, // Opciones del updateOne
      );
    });

    it('should log an error if the order is not found (modifiedCount is 0)', async () => {
      // Configuramos el mock para simular que 0 documentos fueron modificados (fallo de búsqueda)
      mockCollection.updateOne.mockResolvedValue({
        acknowledged: true,
        modifiedCount: 0,
        upsertedId: null,
        upsertedCount: 0,
        matchedCount: 0,
      });

      // Espiamos el console.error para verificar que se llamó
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await service.handleReturnCreated({ data: mockReturnEventData });

      // Verificamos que se llamó a updateOne
      expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);

      // Verificamos que se llamó a console.error con el mensaje de error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'ERROR: La orden 0d117dd2-8d16-4b1d-b4e9-d21361648724 NO fue actualizada.',
        ),
      );

      consoleErrorSpy.mockRestore(); // Restaurar el console.error
    });

    it('should call insertOne on the "devoluciones" collection with the correct mapped document', async () => {
      // Configurar mocks para simular éxito en update y en insert
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
      mockCollection.insertOne.mockResolvedValue({
        acknowledged: true,
        insertedId: mockReturnEventData.returnId,
      });

      await service.handleReturnCreated({ data: mockReturnEventData }); // 1. Verificar que se llamó a la colección 'devoluciones'

      expect(mongoService.getCollection).toHaveBeenCalledWith('devoluciones'); // 2. Verificar que insertOne fue llamado

      expect(mockCollection.insertOne).toHaveBeenCalledTimes(1); // 3. Verificar que insertOne fue llamado con el documento mapeado CORRECTO

      const expectedDocument = {
        _id: mockReturnEventData.returnId,
        orden_id: mockReturnEventData.orderId,
        tipo: mockReturnEventData.type,
        estado: mockReturnEventData.status,
        fecha_solicitud: expect.any(Date),
        motivo: mockReturnEventData.reason,
        items_afectados: mockReturnEventData.returnedItems, // ⬅️ CAMPOS NUEVOS/OPCIONALES DEL ESQUEMA
        fecha_resolucion: null, // Asumimos que es null al inicio
        producto_reemplazo: null, // Asumimos null
        saldo_ajuste: null, // Asumimos null
        monto_reembolsado: 0, // Asumimos 0 o null (según tu código de producción)
        gestionado_por: null, // Asumimos null
      };

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining(expectedDocument),
      );
    });

    it('should not call updateOne if orderId is missing in the payload', async () => {
      const invalidPayload = { data: { returnId: '123', orderId: undefined } };

      // Espiamos console.error para capturar el log de fallo de validación
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await service.handleReturnCreated(invalidPayload);

      // Verificamos que NUNCA se intentó actualizar la base de datos
      expect(mockCollection.updateOne).not.toHaveBeenCalled();

      // Verificamos el log de error de validación
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Evento de devolución incompleto: falta orderId o returnId',
        ),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // ... Aquí continuarías con otras suites de prueba para order-created, order-paid, etc.
});
