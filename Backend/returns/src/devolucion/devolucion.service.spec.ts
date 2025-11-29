/*
import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DevolucionService } from './devolucion.service';
import { Devolucion } from './entities/devolucion.entity';
import { KafkaProducerService } from '../common/kafka/kafkaprovider.service';
import { OrderService } from './order/order.service';
import type { CreateDevolucionDto } from './dto/create-devolucion.dto';
import type { UpdateDevolucionDto } from './dto/update-devolucion.dto';
import { EstadoDevolucion } from '../common/enums/estado-devolucion.enum';

describe('DevolucionService', () => {
  let service: DevolucionService;
  let repository: Repository<Devolucion>;
  let orderService: OrderService;
  let kafkaProducerService: KafkaProducerService;

  const mockDevolucion = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    orderId: 'order-123',
    estado: EstadoDevolucion.PENDIENTE,
    fecha_solicitud: new Date(),
    historial: [],
    items: [],
    reembolso: null,
    reemplazo: null,
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockOrderService = {
    getOrderById: jest.fn(),
  };

  const mockKafkaProducerService = {
    emitReturnCreated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevolucionService,
        {
          provide: getRepositoryToken(Devolucion),
          useValue: mockRepository,
        },
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: KafkaProducerService,
          useValue: mockKafkaProducerService,
        },
      ],
    }).compile();

    service = module.get<DevolucionService>(DevolucionService);
    repository = module.get<Repository<Devolucion>>(getRepositoryToken(Devolucion));
    orderService = module.get<OrderService>(OrderService);
    kafkaProducerService = module.get<KafkaProducerService>(KafkaProducerService);

    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateDevolucionDto = {
      orderId: 'order-123',
      estado: EstadoDevolucion.PENDIENTE,
    };

    it('should create a devolucion successfully', async () => {
      mockOrderService.getOrderById.mockResolvedValue({ id: 'order-123' });
      mockRepository.create.mockReturnValue(mockDevolucion);
      mockRepository.save.mockResolvedValue(mockDevolucion);
      mockKafkaProducerService.emitReturnCreated.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(orderService.getOrderById).toHaveBeenCalledWith('order-123');
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockDevolucion);
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
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of devoluciones', async () => {
      const devoluciones = [mockDevolucion];
      mockRepository.find.mockResolvedValue(devoluciones);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['historial', 'items', 'reembolso', 'reemplazo'],
      });
      expect(result).toEqual(devoluciones);
    });

    it('should return empty array when no devoluciones exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a devolucion when it exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockDevolucion);

      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        relations: ['historial', 'items', 'reembolso', 'reemplazo'],
      });
      expect(result).toEqual(mockDevolucion);
    });

    it('should throw NotFoundException when devolucion does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

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
      mockRepository.findOne.mockResolvedValue(mockDevolucion);
      mockRepository.save.mockResolvedValue(updatedDevolucion);

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedDevolucion);
    });

    it('should verify order exists when orderId is updated', async () => {
      const updateDtoWithOrder: UpdateDevolucionDto = {
        ...updateDto,
        orderId: 'new-order-123',
      } as UpdateDevolucionDto;

      mockRepository.findOne.mockResolvedValue(mockDevolucion);
      mockOrderService.getOrderById.mockResolvedValue({ id: 'new-order-123' });
      mockRepository.save.mockResolvedValue({ ...mockDevolucion, ...updateDtoWithOrder });

      await service.update('123e4567-e89b-12d3-a456-426614174000', updateDtoWithOrder);

      expect(orderService.getOrderById).toHaveBeenCalledWith('new-order-123');
    });

    it('should throw NotFoundException when new orderId does not exist', async () => {
      const updateDtoWithOrder: UpdateDevolucionDto = {
        ...updateDto,
        orderId: 'nonexistent-order',
      } as UpdateDevolucionDto;

      mockRepository.findOne.mockResolvedValue(mockDevolucion);
      mockOrderService.getOrderById.mockResolvedValue(null);

      await expect(
        service.update('123e4567-e89b-12d3-a456-426614174000', updateDtoWithOrder),
      ).rejects.toThrow(new NotFoundException('Order with ID nonexistent-order not found'));
    });

    it('should not verify order when orderId is not changed', async () => {
      const updateDtoSameOrder: UpdateDevolucionDto = {
        ...updateDto,
        orderId: 'order-123', // Same as mockDevolucion.orderId
      } as UpdateDevolucionDto;

      mockRepository.findOne.mockResolvedValue(mockDevolucion);
      mockRepository.save.mockResolvedValue({ ...mockDevolucion, ...updateDtoSameOrder });

      await service.update('123e4567-e89b-12d3-a456-426614174000', updateDtoSameOrder);

      expect(orderService.getOrderById).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a devolucion successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockDevolucion);
      mockRepository.remove.mockResolvedValue(mockDevolucion);

      const result = await service.remove('123e4567-e89b-12d3-a456-426614174000');

      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.remove).toHaveBeenCalledWith(mockDevolucion);
      expect(result).toEqual(mockDevolucion);
    });

    it('should throw NotFoundException when devolucion to remove does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
*/

import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DevolucionService } from './devolucion.service';
import { Devolucion } from './entities/devolucion.entity';
import { KafkaProducerService } from '../common/kafka/kafkaprovider.service';
import { OrderService } from './order/order.service';
import type { CreateDevolucionDto } from './dto/create-devolucion.dto';
import type { UpdateDevolucionDto } from './dto/update-devolucion.dto';
import { EstadoDevolucion } from '../common/enums/estado-devolucion.enum';
import { DevolucionHistorial } from '../devolucion-historial/entities/devolucion-historial.entity';
import { PaymentsService } from '../payments/payments.service';
import { ReembolsoService } from '../reembolso/reembolso.service';
import { InstruccionesDevolucionService } from './services/instrucciones-devolucion.service';
import { AccionItemDevolucion } from '../common/enums/accion-item-devolucion.enum';

// --- Mocks para todas las dependencias ---

const mockDevolucion = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  orderId: 'order-123',
  estado: EstadoDevolucion.PENDIENTE,
  createdAt: new Date(),
  historial: [],
  items: [],
  reembolso: null,
  reemplazo: null,
};

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
};

const mockHistorialRepository = {
  create: jest.fn(),
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

describe('DevolucionService', () => {
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
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(DevolucionHistorial),
          useValue: mockHistorialRepository,
        },
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: KafkaProducerService,
          useValue: mockKafkaProducerService,
        },
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: ReembolsoService,
          useValue: mockReembolsoService,
        },
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

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
          motivo: 'damaged', // Usamos 'motivo' y 'precio_compra' de la entidad
          precio_compra: 99.99,
        },
      ],
      reembolso: null,
      reemplazo: null,
    };

    it('should create devolution, load relations, and emit a complete Kafka event', async () => {
      mockOrderService.getOrderById.mockResolvedValue({
        id: createDto.orderId,
      });
      mockRepository.create.mockReturnValue(savedDevolucion);
      mockRepository.save.mockResolvedValue(savedDevolucion);
      mockRepository.findOne.mockResolvedValue(devolucionWithRelations);

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
      expect(kafkaProducerService.emitReturnCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            returnId: savedDevolucion.id,
            returnedItems: expect.arrayContaining([
              expect.objectContaining({
                productId: 'prod-abc',
                quantity: 1,
              }),
            ]),
          }),
        }),
      );

      expect(result).toEqual(devolucionWithRelations);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockOrderService.getOrderById.mockResolvedValue(null);

      await expect(service.create(createDto as any)).rejects.toThrow(
        new NotFoundException(`Order with ID ${createDto.orderId} not found`),
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of devoluciones', async () => {
      const devoluciones = [mockDevolucion];
      mockRepository.find.mockResolvedValue(devoluciones);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['historial', 'items', 'reembolso', 'reemplazo'],
      });
      expect(result).toEqual(devoluciones);
    });

    it('should return empty array when no devoluciones exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a devolucion when it exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockDevolucion);

      const result = await service.findOne(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(result).toEqual(mockDevolucion);
    });

    it('should throw NotFoundException when devolucion does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        new NotFoundException('Devolución nonexistent-id not found'),
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateDevolucionDto = {
      estado: EstadoDevolucion.COMPLETADA,
    };
    const id = '123e4567-e89b-12d3-a456-426614174000';

    it('should update a devolucion successfully', async () => {
      const updatedDevolucion = { ...mockDevolucion, ...updateDto };
      mockRepository.findOne.mockResolvedValue(mockDevolucion);
      mockRepository.save.mockResolvedValue(updatedDevolucion);

      const result = await service.update(id, updateDto);

      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedDevolucion);
    });

    it('should verify order exists when orderId is updated', async () => {
      const updateDtoWithOrder: UpdateDevolucionDto = {
        ...updateDto,
        orderId: 'new-order-123',
      } as UpdateDevolucionDto;

      mockRepository.findOne.mockResolvedValue(mockDevolucion);
      mockOrderService.getOrderById.mockResolvedValue({ id: 'new-order-123' });
      mockRepository.save.mockResolvedValue({
        ...mockDevolucion,
        ...updateDtoWithOrder,
      });

      await service.update(id, updateDtoWithOrder);

      expect(orderService.getOrderById).toHaveBeenCalledWith('new-order-123');
    });

    it('should throw NotFoundException when new orderId does not exist', async () => {
      const updateDtoWithOrder: UpdateDevolucionDto = {
        ...updateDto,
        orderId: 'nonexistent-order',
      } as UpdateDevolucionDto;

      mockRepository.findOne.mockResolvedValue(mockDevolucion);
      mockOrderService.getOrderById.mockResolvedValue(null);

      await expect(service.update(id, updateDtoWithOrder)).rejects.toThrow(
        new NotFoundException('Order with ID nonexistent-order not found'),
      );
    });

    it('should not verify order when orderId is not changed', async () => {
      const updateDtoSameOrder: UpdateDevolucionDto = {
        ...updateDto,
        orderId: mockDevolucion.orderId, // 'order-123'
      } as UpdateDevolucionDto;

      mockRepository.findOne.mockResolvedValue(mockDevolucion);
      mockRepository.save.mockResolvedValue({
        ...mockDevolucion,
        ...updateDtoSameOrder,
      });

      await service.update(id, updateDtoSameOrder);

      // Esta aserción es la clave. Si falla, el servicio es incorrecto.
      expect(orderService.getOrderById).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a devolucion successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockDevolucion);
      mockRepository.remove.mockResolvedValue(mockDevolucion);

      const result = await service.remove(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(repository.remove).toHaveBeenCalledWith(mockDevolucion);
      expect(result).toEqual(mockDevolucion);
    });

    it('should throw NotFoundException when devolucion to remove does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // Nuevo conjunto de pruebas para approveAndRefund
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
      mockRepository.findOne.mockResolvedValue(devolucionToRefund);

      // Mock para el save en PROCESANDO, el save en COMPLETADA, y el save de Reembolso
      const devolucionProcesando = {
        ...devolucionToRefund,
        estado: EstadoDevolucion.PROCESANDO,
      };
      const devolucionCompletada = {
        ...devolucionToRefund,
        estado: EstadoDevolucion.COMPLETADA,
        reembolso_id: newReembolso.id,
      };

      mockRepository.save
        .mockResolvedValueOnce(devolucionProcesando) // save PROCESANDO
        .mockResolvedValueOnce(devolucionCompletada); // save COMPLETADA

      mockPaymentsService.processRefund.mockResolvedValue(refundResponse);
      mockReembolsoService.create.mockResolvedValue(newReembolso);

      const result = await service.approveAndRefund(id);

      // 1. Verificar búsqueda
      expect(repository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id }, relations: ['items'] }),
      );

      // 2. Verificar llamada a PaymentsService con el monto correcto
      expect(mockPaymentsService.processRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          monto: 100, // 50 * 2 = 100
          orden_id: devolucionToRefund.orderId,
        }),
      );

      // 3. Verificar creación de registro de Reembolso
      expect(mockReembolsoService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          devolucion_id: id,
          monto: 100,
          transaccion_id: 'transaccion-123',
        }),
      );

      // 4. Verificar updates de estado
      expect(repository.save).toHaveBeenCalledTimes(2); // PROCESANDO y luego COMPLETADA

      // 5. Verificar evento Kafka de pago exitoso
      expect(kafkaProducerService.returnPaid).toHaveBeenCalledWith(
        expect.objectContaining({
          devolucionId: id,
          reembolsoId: newReembolso.id,
          monto: 100,
        }),
      );

      expect(result.estado).toBe(EstadoDevolucion.COMPLETADA);
    });

    it('should update to ERROR_REEMBOLSO if payment process fails', async () => {
      mockRepository.findOne.mockResolvedValue(devolucionToRefund);

      const devolucionBase = {
        ...devolucionToRefund,
        estado: EstadoDevolucion.PENDIENTE,
      };
      mockRepository.findOne.mockResolvedValue(devolucionBase);

      const devolucionProcesando = {
        ...devolucionBase,
        estado: EstadoDevolucion.PROCESANDO,
      };
      const devolucionError = {
        ...devolucionBase,
        estado: EstadoDevolucion.ERROR_REEMBOLSO,
      };

      mockRepository.save
        .mockResolvedValueOnce(devolucionProcesando) // save PROCESANDO
        .mockResolvedValueOnce(devolucionError); // save ERROR_REEMBOLSO

      mockPaymentsService.processRefund.mockResolvedValue(null); // Simular fallo de pago

      const result = await service.approveAndRefund(id);

      expect(mockPaymentsService.processRefund).toHaveBeenCalled();
      expect(mockReembolsoService.create).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledTimes(2); // PROCESANDO y luego ERROR
      expect(result.estado).toBe(EstadoDevolucion.ERROR_REEMBOLSO);
    });

    it('should throw NotFoundException if devolution does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.approveAndRefund('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if devolution is not PENDIENTE', async () => {
      const devolucionCompleted = {
        ...mockDevolucion,
        estado: EstadoDevolucion.COMPLETADA,
      };
      mockRepository.findOne.mockResolvedValue(devolucionCompleted);

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

      mockRepository.findOne.mockResolvedValue(devolucionNoRefundItems);
      mockRepository.save.mockResolvedValue(devolucionCompleted);

      const result = await service.approveAndRefund(id);

      expect(mockPaymentsService.processRefund).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledTimes(1); // Solo la transición a COMPLETADA
      expect(result.estado).toBe(EstadoDevolucion.COMPLETADA); // <-- Pasa ahora
    });
  });
});
