import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDevolucionHistorialDto } from './dto/create-devolucion-historial.dto';
import { UpdateDevolucionHistorialDto } from './dto/update-devolucion-historial.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DevolucionHistorial } from './entities/devolucion-historial.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DevolucionHistorialService {
  constructor(
    @InjectRepository(DevolucionHistorial)
    private readonly historialRepository: Repository<DevolucionHistorial>,
  ) {}

  async create(
    createDevolucionHistorialDto: CreateDevolucionHistorialDto,
  ): Promise<DevolucionHistorial> {
    const historial = this.historialRepository.create(
      createDevolucionHistorialDto,
    );
    return await this.historialRepository.save(historial);
  }

  async findAll(): Promise<DevolucionHistorial[]> {
    return await this.historialRepository.find({
      relations: ['devolucion'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findByDevolucion(devolucionId: string): Promise<DevolucionHistorial[]> {
    return await this.historialRepository.find({
      where: { devolucion_id: devolucionId },
      relations: ['devolucion'],
      order: { fecha_creacion: 'ASC' },
    });
  }

  async findOne(id: string): Promise<DevolucionHistorial> {
    const historial = await this.historialRepository.findOne({
      where: { id },
      relations: ['devolucion'],
    });
    if (!historial)
      throw new NotFoundException(
        `Historial de devolución ${id} no encontrado`,
      );
    return historial;
  }

  async update(
    id: string,
    updateDevolucionHistorialDto: UpdateDevolucionHistorialDto,
  ): Promise<DevolucionHistorial> {
    const historial = await this.findOne(id);
    Object.assign(historial, updateDevolucionHistorialDto);
    return await this.historialRepository.save(historial);
  }

  async remove(id: string): Promise<void> {
    const historial = await this.findOne(id);
    await this.historialRepository.remove(historial);
  }
}
