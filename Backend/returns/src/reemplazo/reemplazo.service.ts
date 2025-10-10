import { Injectable } from '@nestjs/common';
import { CreateReemplazoDto } from './dto/create-reemplazo.dto';
import { UpdateReemplazoDto } from './dto/update-reemplazo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Reemplazo } from './entities/reemplazo.entity';
import { Repository } from 'typeorm';
import { Devolucion } from '../devolucion/entities/devolucion.entity';

@Injectable()
export class ReemplazoService {
  constructor(
    @InjectRepository(Reemplazo)
    private readonly reemplazoRepository: Repository<Reemplazo>,

    @InjectRepository(Devolucion)
    private readonly devolucionRepository: Repository<Devolucion>,
  ) {}
  async create(createReemplazoDto: CreateReemplazoDto) {
    const reemplazo = this.reemplazoRepository.create(createReemplazoDto);
    return await this.reemplazoRepository.save(reemplazo);
  }

  async findAll() {
    return this.reemplazoRepository.find({ relations: ['devolucion'] });
  }

  async findOne(id: string) {
    const reemplazo = await this.reemplazoRepository.findOne({
      where: { id },
      relations: ['devolucion'],
    });
    if (!reemplazo) throw new Error(`Reemplazo ${id} not found`);
    return reemplazo;
  }

  async update(id: string, updateReemplazoDto: UpdateReemplazoDto) {
    const reemplazo = await this.findOne(id);
    Object.assign(reemplazo, updateReemplazoDto);
    return await this.reemplazoRepository.save(reemplazo);
  }

  async remove(id: string) {
    const reemplazo = await this.findOne(id);
    return await this.reemplazoRepository.remove(reemplazo);
  }
}
