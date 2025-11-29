import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DevolucionService } from './devolucion.service';
import { Devolucion } from './entities/devolucion.entity';
import { DevolucionHistorial } from '../devolucion-historial/entities/devolucion-historial.entity';
import { OrderService } from './order/order.service';
import { KafkaProducerService } from '../common/kafka/kafkaprovider.service';
import { PaymentsService } from '../payments/payments.service';
import { ReembolsoService } from '../reembolso/reembolso.service';
import { InstruccionesDevolucionService } from './services/instrucciones-devolucion.service';
import { EstadoDevolucion } from '../common/enums/estado-devolucion.enum';
import { AccionItemDevolucion } from '../common/enums/accion-item-devolucion.enum';

// Nota: Simulación de DTOs para evitar errores de tipo en el archivo de prueba
type CreateDevolucionDto = any;
type UpdateDevolucionDto = any;

// --- Mocks Centrales para Dependencias y Repositorios ---
const mockDevolucion = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  orderId: 'order-123',
  codOrden: 'order-123',
  codDevolucion: 'DEV-20251129-000001',
  correlativo: 1,
  datosCliente: {
    idUsuario: 'N/A',
    nombres: 'N/A',
    telefono: 'N/A',
  },
  estado: EstadoDevolucion.PENDIENTE,
  createdAt: new Date(),
  historial: [],
  items: [],
  reembolso: null,
  reemplazo: null,
};

// Repositorio de Devolución unificado
const mockDevolucionRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
};

// Repositorio de Historial
const mockHistorialRepository = {
  create: jest.fn((entity) => entity),
  save: jest.fn(),
};

const mockOrderService = {
  getOrderById: jest.fn(),
};

const mockKafkaProducerService = {
  emitReturnCreated: jest.fn(),
  returnPaid: jest.fn(),
  emitReturnApproved: jest.fn(),
  emitReturnRejected: jest.fn(),
};

const mockPaymentsService = {
  processRefund: jest.fn(),
};

const mockReembolsoService = {
  create: jest.fn(),
};

const mockInstruccionesService = {
  generarInstrucciones: jest.fn().mockResolvedValue({
    numeroAutorizacion: 'RMA-123',
    metodo: 'pickup',
    instrucciones: 'Empaquete el producto.',
  }),
};

// --- INICIO DEL BLOQUE DE PRUEBAS PRINCIPAL ---
describe('DevolucionService (ECO-117, ECO-118, ECO-119)', () => {
  let service: DevolucionService;
  let repository: Repository<Devolucion>;
  let orderService: OrderService;
  let kafkaProducerService: KafkaProducerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevolucionService,
        {
          provide: getRepositoryToken(Devolucion),
          useValue: mockDevolucionRepository,
        },
        {
          provide: getRepositoryToken(DevolucionHistorial),
          useValue: mockHistorialRepository,
        },
        { provide: OrderService, useValue: mockOrderService },
        { provide: KafkaProducerService, useValue: mockKafkaProducerService },
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: ReembolsoService, useValue: mockReembolsoService },
        {
          provide: InstruccionesDevolucionService,
          useValue: mockInstruccionesService,
        },
      ],
    }).compile();

    service = module.get<DevolucionService>(DevolucionService);
    repository = module.get<Repository<Devolucion>>(
      getRepositoryToken(Devolucion),
    );
    orderService = module.get<OrderService>(OrderService);
    kafkaProducerService =
      module.get<KafkaProducerService>(KafkaProducerService);

    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });
  // ----------------------------------------------------------------------
  // --- BLOQUE: create (Creación de Solicitud de Devolución) ---
  // ----------------------------------------------------------------------
  describe('create', () => {
    const createDto: CreateDevolucionDto = {
      orderId: 'order-123',
    } as CreateDevolucionDto;

    const savedDevolucion = {
      ...mockDevolucion,
      id: 'new-uuid-456',
      orderId: createDto.orderId,
      items: [],
    };

    const devolucionWithRelations = {
      ...savedDevolucion,
      items: [
        {
          id: 'item-1',
          producto_id: 'prod-abc',
          cantidad: 1,
          moneda: 'USD',
          motivo: 'damaged',
          precio_compra: 99.99,
          tipo_accion: AccionItemDevolucion.REEMBOLSO, // Añadido para Kafka event
        },
      ],
      reembolso: null,
      reemplazo: null,
    };

    it('should create devolution, load relations, and emit a complete Kafka event', async () => {
      mockOrderService.getOrderById.mockResolvedValue({
        id: createDto.orderId,
      });
      mockDevolucionRepository.find.mockResolvedValue([]);
      mockDevolucionRepository.create.mockReturnValue(savedDevolucion);
      mockDevolucionRepository.save.mockResolvedValue(savedDevolucion);
      mockDevolucionRepository.findOne.mockResolvedValue(
        devolucionWithRelations,
      );

      const result = await service.create(createDto as any);

      expect(orderService.getOrderById).toHaveBeenCalledWith(createDto.orderId);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: EstadoDevolucion.PENDIENTE,
        }),
      );
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['items', 'reembolso', 'reemplazo'],
        }),
      );
      expect(kafkaProducerService.emitReturnCreated).toHaveBeenCalledTimes(2);
      expect(result).toEqual(devolucionWithRelations);
    });

    it('should throw NotFoundException if order does not exist', async () => {
      mockOrderService.getOrderById.mockResolvedValue(null);
      await expect(service.create(createDto as any)).rejects.toThrow(
        new NotFoundException(`Order with ID ${createDto.orderId} not found`),
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });
  // ----------------------------------------------------------------------
  // --- BLOQUE: executeRefund (Manejo de reembolso interno/existente) ---
  // ----------------------------------------------------------------------
  describe('executeRefund', () => {
    const devolucionId = 'dev-uuid-123';

    it('debe procesar el reembolso correctamente cuando el estado es PROCESANDO', async () => {
      // Datos simulados de la devolución
      const mockDevolucionToProcess = {
        id: devolucionId,
        orderId: 'order-uuid-456',
        estado: EstadoDevolucion.PROCESANDO, // Estado correcto
        items: [
          {
            tipo_accion: AccionItemDevolucion.REEMBOLSO,
            precio_compra: 100,
            cantidad: 1,
            moneda: 'PEN',
          },
        ],
      };

      mockDevolucionRepository.findOne.mockResolvedValue(
        mockDevolucionToProcess,
      );
      mockPaymentsService.processRefund.mockResolvedValue({
        status: 'EXITOSO',
        reembolso_id: 'transaccion-789',
        fecha_reembolso: new Date(),
      });
      mockReembolsoService.create.mockResolvedValue({
        id: 'reembolso-db-uuid',
      });

      await service.executeRefund(devolucionId);

      expect(mockPaymentsService.processRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          orden_id: 'order-uuid-456',
          monto: 100,
        }),
      );
      expect(mockReembolsoService.create).toHaveBeenCalled();
      expect(mockDevolucionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: EstadoDevolucion.COMPLETADA,
          reembolso_id: 'reembolso-db-uuid',
        }),
      );
      expect(mockKafkaProducerService.returnPaid).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si la devolución no está en estado PROCESANDO ni PENDIENTE', async () => {
      const mockDevolucionState = {
        id: devolucionId,
        estado: EstadoDevolucion.CANCELADA,
        items: [],
      };
      mockDevolucionRepository.findOne.mockResolvedValue(mockDevolucionState);

      await expect(service.executeRefund(devolucionId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe cambiar el estado a ERROR_REEMBOLSO si la API de pagos falla', async () => {
      const mockDevolucionFail = {
        id: devolucionId,
        orderId: 'order-123',
        estado: EstadoDevolucion.PROCESANDO,
        items: [
          {
            tipo_accion: AccionItemDevolucion.REEMBOLSO,
            precio_compra: 50,
            cantidad: 1,
          },
        ],
      };
      mockDevolucionRepository.findOne.mockResolvedValue(mockDevolucionFail);
      mockPaymentsService.processRefund.mockResolvedValue(null); // Simular fallo de pago

      await service.executeRefund(devolucionId);

      expect(mockDevolucionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: EstadoDevolucion.ERROR_REEMBOLSO,
        }),
      );
    });
  });
  // ----------------------------------------------------------------------
  // --- BLOQUE: approveAndRefund (Aprobación y Reembolso Directo) ---
  // ----------------------------------------------------------------------
  describe('approveAndRefund', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';

    const devolucionToRefund = {
      ...mockDevolucion,
      items: [
        {
          tipo_accion: AccionItemDevolucion.REEMBOLSO,
          precio_compra: 50,
          cantidad: 2,
          moneda: 'USD',
        }, // Total 100
        {
          tipo_accion: AccionItemDevolucion.REEMPLAZO,
          precio_compra: 10,
          cantidad: 1,
          moneda: 'USD',
        }, // Ignorado
      ],
      estado: EstadoDevolucion.PENDIENTE,
    };

    const refundResponse = {
      reembolso_id: 'transaccion-123',
      fecha_reembolso: new Date().toISOString(),
    };

    const newReembolso = {
      id: 'reembolso-uuid',
      monto: 100,
      transaccion_id: 'transaccion-123',
    };

    it('should successfully approve, process refund, and update status', async () => {
      mockDevolucionRepository.findOne.mockResolvedValue(devolucionToRefund);
      mockPaymentsService.processRefund.mockResolvedValue(refundResponse);
      mockReembolsoService.create.mockResolvedValue(newReembolso);

      const devolucionProcesando = {
        ...devolucionToRefund,
        estado: EstadoDevolucion.PROCESANDO,
      };
      const devolucionCompletada = {
        ...devolucionToRefund,
        estado: EstadoDevolucion.COMPLETADA,
        reembolso_id: newReembolso.id,
      };

      mockDevolucionRepository.save
        .mockResolvedValueOnce(devolucionProcesando) // save PROCESANDO
        .mockResolvedValueOnce(devolucionCompletada); // save COMPLETADA

      const result = await service.approveAndRefund(id);

      expect(mockPaymentsService.processRefund).toHaveBeenCalledWith(
        expect.objectContaining({ monto: 100 }),
      );
      expect(mockReembolsoService.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledTimes(2);
      expect(kafkaProducerService.returnPaid).toHaveBeenCalled();
      expect(result.estado).toBe(EstadoDevolucion.COMPLETADA);
    });

    it('should update to ERROR_REEMBOLSO if payment process fails', async () => {
      const devolucionBase = {
        ...devolucionToRefund,
        estado: EstadoDevolucion.PENDIENTE,
      };
      mockDevolucionRepository.findOne.mockResolvedValue(devolucionBase);
      mockPaymentsService.processRefund.mockResolvedValue(null); // Simular fallo de pago

      const devolucionProcesando = {
        ...devolucionBase,
        estado: EstadoDevolucion.PROCESANDO,
      };
      const devolucionError = {
        ...devolucionBase,
        estado: EstadoDevolucion.ERROR_REEMBOLSO,
      };

      mockDevolucionRepository.save
        .mockResolvedValueOnce(devolucionProcesando) // save PROCESANDO
        .mockResolvedValueOnce(devolucionError); // save ERROR_REEMBOLSO

      const result = await service.approveAndRefund(id);

      expect(mockReembolsoService.create).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledTimes(2);
      expect(result.estado).toBe(EstadoDevolucion.ERROR_REEMBOLSO);
    });

    it('should throw NotFoundException if devolution does not exist', async () => {
      mockDevolucionRepository.findOne.mockResolvedValue(null);
      await expect(service.approveAndRefund('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if devolution is not PENDIENTE', async () => {
      const devolucionCompleted = {
        ...mockDevolucion,
        estado: EstadoDevolucion.COMPLETADA,
      };
      mockDevolucionRepository.findOne.mockResolvedValue(devolucionCompleted);

      await expect(service.approveAndRefund(id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should mark as COMPLETED immediately if total refund amount is zero or less', async () => {
      const devolucionNoRefundItems = {
        ...mockDevolucion,
        items: [
          {
            tipo_accion: AccionItemDevolucion.REEMPLAZO,
            precio_compra: 10,
            cantidad: 1,
            moneda: 'USD',
          },
        ],
        estado: EstadoDevolucion.PENDIENTE,
      };
      const devolucionCompleted = {
        ...devolucionNoRefundItems,
        estado: EstadoDevolucion.COMPLETADA,
      };

      mockDevolucionRepository.findOne.mockResolvedValue(
        devolucionNoRefundItems,
      );
      mockDevolucionRepository.save.mockResolvedValue(devolucionCompleted);

      const result = await service.approveAndRefund(id);

      expect(mockPaymentsService.processRefund).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result.estado).toBe(EstadoDevolucion.COMPLETADA);
    });
  });
});
