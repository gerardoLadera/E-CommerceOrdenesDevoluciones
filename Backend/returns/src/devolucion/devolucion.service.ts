import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDevolucionDto } from './dto/create-devolucion.dto';
import { UpdateDevolucionDto } from './dto/update-devolucion.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Devolucion } from './entities/devolucion.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DevolucionService {
  constructor(
    @InjectRepository(Devolucion)
    private readonly devolucionRepository: Repository<Devolucion>,
  ) {}
  create(createDevolucionDto: CreateDevolucionDto) {
    const devolucion = this.devolucionRepository.create(createDevolucionDto);
    return this.devolucionRepository.save(devolucion);
  }

  async findAll() {
    return await this.devolucionRepository.find({
      relations: ['historial', 'items', 'reembolso', 'reemplazo'],
    });
  }

  async findOne(id: string) {
    const devolucion = await this.devolucionRepository.findOne({
      where: { id },
      relations: ['historial', 'items', 'reembolso', 'reemplazo'],
    });
    if (!devolucion) throw new NotFoundException(`Devolución ${id} not found`);
    return devolucion;
  }

  async update(id: string, updateDevolucionDto: UpdateDevolucionDto) {
    const devolucion = await this.findOne(id);
    Object.assign(devolucion, updateDevolucionDto);
    return await this.devolucionRepository.save(devolucion);
  }

  async remove(id: string) {
    const devolucion = await this.findOne(id);
    return await this.devolucionRepository.remove(devolucion);
  }
}
