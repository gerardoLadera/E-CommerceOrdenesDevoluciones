
import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DevolucionService } from './devolucion.service';
import { Devolucion } from './entities/devolucion.entity';
import { DevolucionHistorial } from '../devolucion-historial/entities/devolucion-historial.entity';
import { OrderService } from './order/order.service';
import { OrderCommandService } from './order/order-command.service';
import { KafkaProducerService } from '../common/kafka/kafkaprovider.service';
import { PaymentsService } from '../payments/payments.service';
import { ReembolsoService } from '../reembolso/reembolso.service';
import { InstruccionesDevolucionService } from './services/instrucciones-devolucion.service';
import { NotificationService } from '../common/services/notification.service';
import { EstadoDevolucion } from '../common/enums/estado-devolucion.enum';
import { AccionItemDevolucion } from '../common/enums/accion-item-devolucion.enum';
import { CreateDevolucionDto } from './dto/create-devolucion.dto';
import { UpdateDevolucionDto } from './dto/update-devolucion.dto';

describe('DevolucionService', () => {
  let service: DevolucionService;
  let devolucionRepository: Repository<Devolucion>;
  let historialRepository: Repository<DevolucionHistorial>;
  let orderService: OrderService;
  let orderCommandService: OrderCommandService;
  let kafkaProducerService: KafkaProducerService;
  let paymentsService: PaymentsService;
  let reembolsoService: ReembolsoService;

  const mockDevolucion = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    orderId: 'order-123',
    estado: EstadoDevolucion.PENDIENTE,
    fecha_solicitud: new Date(),
    correlativo: 1,
    codDevolucion: 'DEV-20251129-000001',
    historial: [],
    items: [],
    reembolso: null,
    reemplazos: [],
  };

  const mockDevolucionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockHistorialRepository = {
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockOrderService = {
    getOrderById: jest.fn(),
  };

  const mockOrderCommandService = {
    createReplacementOrder: jest.fn(),
  };

  const mockKafkaProducerService = {
    returnPaid: jest.fn(),
    emitReturnCreated: jest.fn(),
    emitReturnApproved: jest.fn(),
    emitReturnRejected: jest.fn(),
    emitReplacementSent: jest.fn(),
    emitReturnInstructionsGenerated: jest.fn(),
  };

  const mockPaymentsService = {
    processRefund: jest.fn(),
  };

  const mockReembolsoService = {
    create: jest.fn(),
    findByDevolucionId: jest.fn(),
    update: jest.fn(),
  };

  const mockInstruccionesService = {
    generarInstrucciones: jest.fn(),
  };

  const mockNotificationService = {
    sendDevolucionApprovalNotification: jest.fn(),
    sendDevolucionRejectionNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevolucionService,
        { provide: getRepositoryToken(Devolucion), useValue: mockDevolucionRepository },
        { provide: getRepositoryToken(DevolucionHistorial), useValue: mockHistorialRepository },
        { provide: OrderService, useValue: mockOrderService },
        { provide: OrderCommandService, useValue: mockOrderCommandService },
        { provide: KafkaProducerService, useValue: mockKafkaProducerService },
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: ReembolsoService, useValue: mockReembolsoService },
        { provide: InstruccionesDevolucionService, useValue: mockInstruccionesService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<DevolucionService>(DevolucionService);
    devolucionRepository = module.get<Repository<Devolucion>>(getRepositoryToken(Devolucion));
    historialRepository = module.get<Repository<DevolucionHistorial>>(getRepositoryToken(DevolucionHistorial));
    orderService = module.get<OrderService>(OrderService);
    orderCommandService = module.get<OrderCommandService>(OrderCommandService);
    kafkaProducerService = module.get<KafkaProducerService>(KafkaProducerService);
    paymentsService = module.get<PaymentsService>(PaymentsService);
    reembolsoService = module.get<ReembolsoService>(ReembolsoService);
    
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateDevolucionDto = {
      orderId: 'order-123',
      estado: EstadoDevolucion.PENDIENTE,
    };

    it('should create a devolucion successfully', async () => {
      mockOrderService.getOrderById.mockResolvedValue({ id: 'order-123' });
      mockDevolucionRepository.find.mockResolvedValue([{ correlativo: 0 }]);
      mockDevolucionRepository.create.mockReturnValue(mockDevolucion);
      mockDevolucionRepository.save.mockResolvedValue(mockDevolucion);
      mockKafkaProducerService.emitReturnCreated.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(orderService.getOrderById).toHaveBeenCalledWith('order-123');
      expect(mockDevolucionRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        orderId: 'order-123',
        codDevolucion: expect.stringMatching(/^DEV-\d{8}-\d{6}$/),
        correlativo: expect.any(Number),
      }));
      expect(mockDevolucionRepository.save).toHaveBeenCalled();
      expect(kafkaProducerService.emitReturnCreated).toHaveBeenCalledWith({
        eventType: 'return-created',
        data: mockDevolucion,
        timestamp: expect.any(String),
      });
      expect(result).toEqual(mockDevolucion);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockOrderService.getOrderById.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(`Order with ID ${createDto.orderId} not found`),
      );

      expect(orderService.getOrderById).toHaveBeenCalledWith('order-123');
      expect(mockDevolucionRepository.create).not.toHaveBeenCalled();
      expect(mockDevolucionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of devoluciones', async () => {
      const devoluciones = [mockDevolucion];
      mockDevolucionRepository.find.mockResolvedValue(devoluciones);

      const result = await service.findAll();

      expect(mockDevolucionRepository.find).toHaveBeenCalledWith({
        relations: ['historial', 'items', 'reembolso', 'reemplazos'],
      });
      expect(result).toEqual(devoluciones);
    });

    it('should return empty array when no devoluciones exist', async () => {
      mockDevolucionRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a devolucion when it exists', async () => {
      mockDevolucionRepository.findOne.mockResolvedValue(mockDevolucion);
      mockOrderService.getOrderById.mockResolvedValue({ usuarioId: 'user-123', direccionEnvio: { nombreCompleto: 'John Doe' } });

      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(mockDevolucionRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        relations: ['historial', 'items', 'reembolso', 'reemplazos'],
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when devolucion does not exist', async () => {
      mockDevolucionRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        new NotFoundException('Devolución nonexistent-id not found'),
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateDevolucionDto = {
      estado: EstadoDevolucion.COMPLETADA,
    };

    it('should update a devolucion successfully', async () => {
      const updatedDevolucion = { ...mockDevolucion, ...updateDto };
      mockDevolucionRepository.findOne.mockResolvedValue(mockDevolucion);
      mockOrderService.getOrderById.mockResolvedValue({ usuarioId: 'user-123' });
      mockDevolucionRepository.save.mockResolvedValue(updatedDevolucion);

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(mockDevolucionRepository.findOne).toHaveBeenCalled();
      expect(mockDevolucionRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedDevolucion);
    });
  });

  describe('executeRefund', () => {
    it('debe cambiar el estado a ERROR_REEMBOLSO si la API de pagos falla', async () => {
      const devolucionConItems = {
        id: 'dev-uuid-123',
        orderId: 'order-123',
        estado: EstadoDevolucion.PROCESANDO,
        items: [{ tipo_accion: AccionItemDevolucion.REEMBOLSO, precio_compra: 50, cantidad: 1, moneda: 'PEN' }],
      };

      mockDevolucionRepository.findOne.mockResolvedValue(devolucionConItems);
      mockDevolucionRepository.save.mockResolvedValue({ ...devolucionConItems, estado: EstadoDevolucion.ERROR_REEMBOLSO });
      mockPaymentsService.processRefund.mockResolvedValue(null);
      mockHistorialRepository.create.mockReturnValue({});
      mockHistorialRepository.save.mockResolvedValue({});

      await service.executeRefund('dev-uuid-123');

      expect(mockDevolucionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        estado: EstadoDevolucion.ERROR_REEMBOLSO
      }));
    });
  });
});

describe('Initial Test Suite', () => {
  it('should pass if the test environment is correctly configured', () => {
    // Prueba de humo para probar el pileline CICD
    expect(true).toBe(true);
  });
});
