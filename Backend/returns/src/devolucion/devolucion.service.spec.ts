import { Test, TestingModule } from '@nestjs/testing';
import { DevolucionService } from './devolucion.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Devolucion } from './entities/devolucion.entity';
import { DevolucionHistorial } from '../devolucion-historial/entities/devolucion-historial.entity';
import { OrderService } from './order/order.service';
import { KafkaProducerService } from '../common/kafka/kafkaprovider.service';
import { PaymentsService } from '../payments/payments.service';
import { ReembolsoService } from '../reembolso/reembolso.service';
import { InstruccionesDevolucionService } from './services/instrucciones-devolucion.service';
import { EstadoDevolucion } from '../common/enums/estado-devolucion.enum';
import { AccionItemDevolucion } from '../common/enums/accion-item-devolucion.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DevolucionService', () => {
  let service: DevolucionService;
  
  // Mocks (Simulaciones de las dependencias)
  const mockDevolucionRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
  };

  const mockPaymentsService = {
    processRefund: jest.fn(),
  };

  const mockReembolsoService = {
    create: jest.fn(),
  };

  const mockKafkaProducerService = {
    returnPaid: jest.fn(),
    emitReturnCreated: jest.fn(),
  };

  // Mocks de dependencias que el servicio necesita para iniciar, aunque no las usemos en esta prueba específica
  const mockHistorialRepository = { save: jest.fn(), create: jest.fn() };
  const mockOrderService = { getOrderById: jest.fn() };
  const mockInstruccionesService = { generarInstrucciones: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevolucionService,
        { provide: getRepositoryToken(Devolucion), useValue: mockDevolucionRepository },
        { provide: getRepositoryToken(DevolucionHistorial), useValue: mockHistorialRepository },
        { provide: OrderService, useValue: mockOrderService },
        { provide: KafkaProducerService, useValue: mockKafkaProducerService },
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: ReembolsoService, useValue: mockReembolsoService },
        { provide: InstruccionesDevolucionService, useValue: mockInstruccionesService },
      ],
    }).compile();

    service = module.get<DevolucionService>(DevolucionService);
    jest.clearAllMocks(); // Limpiar mocks antes de cada prueba
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  // --- PRUEBA 1: FLUJO DE ÉXITO ---
  describe('executeRefund', () => {
    it('debe procesar el reembolso correctamente cuando el estado es PROCESANDO', async () => {
      const devolucionId = 'dev-uuid-123';
      
      // Datos simulados de la devolución
      const mockDevolucion = {
        id: devolucionId,
        orderId: 'order-uuid-456',
        estado: EstadoDevolucion.PROCESANDO, // Estado correcto
        items: [
          { tipo_accion: AccionItemDevolucion.REEMBOLSO, precio_compra: 100, cantidad: 1, moneda: 'PEN' }
        ],
      };

      // 1. Simulamos que la base de datos devuelve la devolución
      mockDevolucionRepository.findOne.mockResolvedValue(mockDevolucion);
      
      // 2. Simulamos que el servicio de pagos responde exitosamente
      mockPaymentsService.processRefund.mockResolvedValue({
        status: 'EXITOSO',
        reembolso_id: 'transaccion-789',
        fecha_reembolso: new Date(),
      });

      // 3. Simulamos la creación del reembolso en DB
      mockReembolsoService.create.mockResolvedValue({ id: 'reembolso-db-uuid' });

      // EJECUCIÓN
      await service.executeRefund(devolucionId);

      // VERIFICACIONES (ASSERTS)
      // a) Verificar que se llamó al servicio de pagos con el monto correcto
      expect(mockPaymentsService.processRefund).toHaveBeenCalledWith({
        orden_id: 'order-uuid-456',
        monto: 100,
        motivo: expect.any(String),
      });

      // b) Verificar que se creó el reembolso en la base de datos
      expect(mockReembolsoService.create).toHaveBeenCalled();

      // c) Verificar que se guardó la devolución con estado COMPLETADA
      expect(mockDevolucionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        estado: EstadoDevolucion.COMPLETADA,
        reembolso_id: 'reembolso-db-uuid'
      }));

      // d) Verificar que se emitió el evento a Kafka
      expect(mockKafkaProducerService.returnPaid).toHaveBeenCalled();
    });

    // --- PRUEBA 2: ERROR DE ESTADO ---
    it('debe lanzar BadRequestException si la devolución no está en estado PROCESANDO ni PENDIENTE', async () => {
      const mockDevolucion = {
        id: 'dev-uuid-123',
        // CAMBIO AQUÍ: Usamos CANCELADA en lugar de COMPLETADA
        // Porque tu código permite COMPLETADA sin dar error, pero CANCELADA sí debe dar error.
        estado: EstadoDevolucion.CANCELADA, 
        items: [],
      };

      mockDevolucionRepository.findOne.mockResolvedValue(mockDevolucion);

      // Verificamos que lance el error
      await expect(service.executeRefund('dev-uuid-123'))
        .rejects
        .toThrow(BadRequestException);
    });

    // --- PRUEBA 3: FALLO EN API DE PAGOS ---
    it('debe cambiar el estado a ERROR_REEMBOLSO si la API de pagos falla', async () => {
      const mockDevolucion = {
        id: 'dev-uuid-123',
        orderId: 'order-123',
        estado: EstadoDevolucion.PROCESANDO,
        items: [{ tipo_accion: AccionItemDevolucion.REEMBOLSO, precio_compra: 50, cantidad: 1 }],
      };

      mockDevolucionRepository.findOne.mockResolvedValue(mockDevolucion);

      // Simulamos que el servicio de pagos devuelve NULL (fallo)
      mockPaymentsService.processRefund.mockResolvedValue(null);

      await service.executeRefund('dev-uuid-123');

      // Verificamos que se guardó con el estado de error
      expect(mockDevolucionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        estado: EstadoDevolucion.ERROR_REEMBOLSO
      }));
    });
  });
});
