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
    reemplazos: [],
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
        relations: ['historial', 'items', 'reembolso', 'reemplazos'],
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
        relations: ['historial', 'items', 'reembolso', 'reemplazos'],
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
describe('Initial Test Suite', () => {
  it('should pass if the test environment is correctly configured', () => {
    // Prueba de humo para probar el pileline CICD
    expect(true).toBe(true);
  });
});
