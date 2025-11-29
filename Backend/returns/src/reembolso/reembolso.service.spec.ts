import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { ReembolsoService } from './reembolso.service';
import { Reembolso } from './entities/reembolso.entity';
import type { CreateReembolsoDto } from './dto/create-reembolso.dto';
import type { UpdateReembolsoDto } from './dto/update-reembolso.dto';
import { Devolucion } from '../devolucion/entities/devolucion.entity';

describe('ReembolsoService', () => {
  let service: ReembolsoService;
  let repository: Repository<Reembolso>;
  let devolucionRepository: Repository<Devolucion>;

  const mockReembolso = {
    id: '456e7890-e89b-12d3-a456-426614174000',
    devolucion_id: '123e4567-e89b-12d3-a456-426614174000',
    monto: 100.50,
    fecha_procesamiento: '2025-01-15T10:30:00Z',
    estado: 'procesado',
    transaccion_id: 'TRX-12345',
    moneda: 'USD',
    devolucion: null,
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockDevolucionRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReembolsoService,
        {
          provide: getRepositoryToken(Reembolso),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Devolucion),
          useValue: mockDevolucionRepository,
        },
      ],
    }).compile();

    service = module.get<ReembolsoService>(ReembolsoService);
    repository = module.get<Repository<Reembolso>>(getRepositoryToken(Reembolso));
    devolucionRepository = module.get<Repository<Devolucion>>(getRepositoryToken(Devolucion));

    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateReembolsoDto = {
      devolucion_id: '123e4567-e89b-12d3-a456-426614174000',
      monto: 100.50,
      fecha_procesamiento: '2025-01-15T10:30:00Z',
      estado: 'procesado',
      transaccion_id: 'TRX-12345',
      moneda: 'USD',
    };

    it('should create a reembolso successfully', async () => {
      mockRepository.create.mockReturnValue(mockReembolso);
      mockRepository.save.mockResolvedValue(mockReembolso);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockReembolso);
      expect(result).toEqual(mockReembolso);
    });

    it('should create reembolso with correct decimal precision', async () => {
      const dtoWithPrecision: CreateReembolsoDto = {
        ...createDto,
        monto: 99.99,
      };
      const reembolsoWithPrecision = { ...mockReembolso, monto: 99.99 };

      mockRepository.create.mockReturnValue(reembolsoWithPrecision);
      mockRepository.save.mockResolvedValue(reembolsoWithPrecision);

      const result = await service.create(dtoWithPrecision);

      expect(result.monto).toBe(99.99);
    });
  });

  describe('findAll', () => {
    it('should return an array of reembolsos ordered by fecha_procesamiento DESC', async () => {
      const reembolsos = [
        mockReembolso,
        { ...mockReembolso, id: 'another-id', fecha_procesamiento: '2025-01-14T10:30:00Z' },
      ];
      mockRepository.find.mockResolvedValue(reembolsos);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['devolucion'],
        order: { fecha_procesamiento: 'DESC' },
      });
      expect(result).toEqual(reembolsos);
    });

    it('should return empty array when no reembolsos exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a reembolso when it exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockReembolso);

      const result = await service.findOne('456e7890-e89b-12d3-a456-426614174000');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '456e7890-e89b-12d3-a456-426614174000' },
        relations: ['devolucion'],
      });
      expect(result).toEqual(mockReembolso);
    });

    it('should throw NotFoundException when reembolso does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        new NotFoundException('Reembolso nonexistent-id no encontrado'),
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateReembolsoDto = {
      estado: 'completado',
      monto: 150.75,
    };

    it('should update a reembolso successfully', async () => {
      const updatedReembolso = { ...mockReembolso, ...updateDto };
      mockRepository.findOne.mockResolvedValue(mockReembolso);
      mockRepository.save.mockResolvedValue(updatedReembolso);

      const result = await service.update('456e7890-e89b-12d3-a456-426614174000', updateDto);

      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(updatedReembolso);
      expect(result).toEqual(updatedReembolso);
      expect(result.estado).toBe('completado');
      expect(result.monto).toBe(150.75);
    });

    it('should throw NotFoundException when reembolso to update does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      const partialUpdateDto: UpdateReembolsoDto = {
        estado: 'cancelado',
      };
      const updatedReembolso = { ...mockReembolso, estado: 'cancelado' };

      mockRepository.findOne.mockResolvedValue(mockReembolso);
      mockRepository.save.mockResolvedValue(updatedReembolso);

      const result = await service.update('456e7890-e89b-12d3-a456-426614174000', partialUpdateDto);

      expect(result.estado).toBe('cancelado');
      expect(result.monto).toBe(mockReembolso.monto); // Should remain unchanged
    });
  });

  describe('remove', () => {
    it('should remove a reembolso successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockReembolso);
      mockRepository.remove.mockResolvedValue(mockReembolso);

      const result = await service.remove('456e7890-e89b-12d3-a456-426614174000');

      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.remove).toHaveBeenCalledWith(mockReembolso);
      expect(result).toEqual(mockReembolso);
    });

    it('should throw NotFoundException when reembolso to remove does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(NotFoundException);

      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
