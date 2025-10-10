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
  async create(createDevolucionHistorialDto: CreateDevolucionHistorialDto) {
    const historial = this.historialRepository.create(
      createDevolucionHistorialDto,
    );
    return await this.historialRepository.save(historial);
  }

  async findAll() {
    return await this.historialRepository.find({
      relations: ['devolucion'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findOne(id: string) {
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
  ) {
    const historial = await this.findOne(id);
    Object.assign(historial, updateDevolucionHistorialDto);
    return await this.historialRepository.save(historial);
  }

  async remove(id: string) {
    const historial = await this.findOne(id);
    return await this.historialRepository.remove(historial);
  }
}
