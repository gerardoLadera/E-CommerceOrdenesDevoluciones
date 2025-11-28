import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reembolso } from './entities/reembolso.entity';
import { CreateReembolsoDto } from './dto/create-reembolso.dto';
import { UpdateReembolsoDto } from './dto/update-reembolso.dto';

@Injectable()
export class ReembolsoService {
  constructor(
    @InjectRepository(Reembolso)
    private readonly reembolsoRepository: Repository<Reembolso>,
  ) {}

  async create(createReembolsoDto: CreateReembolsoDto) {
    const reembolso = this.reembolsoRepository.create(createReembolsoDto);
    return await this.reembolsoRepository.save(reembolso);
  }

  async findAll() {
    return await this.reembolsoRepository.find({
      relations: ['devolucion'],
      order: { fecha_procesamiento: 'DESC' },
    });
  }

  async findOne(id: string) {
    const reembolso = await this.reembolsoRepository.findOne({
      where: { id },
      relations: ['devolucion'],
    });
    if (!reembolso)
      throw new NotFoundException(`Reembolso ${id} no encontrado`);
    return reembolso;
  }

  async update(id: string, updateReembolsoDto: UpdateReembolsoDto) {
    const reembolso = await this.findOne(id);
    Object.assign(reembolso, updateReembolsoDto);
    return await this.reembolsoRepository.save(reembolso);
  }

  async remove(id: string) {
    const reembolso = await this.findOne(id);
    return await this.reembolsoRepository.remove(reembolso);
  }

  /**
   * Buscar reembolso por ID de devolución
   */
  async findByDevolucionId(devolucionId: string): Promise<Reembolso | null> {
    const reembolso = await this.reembolsoRepository.findOne({
      where: { devolucion_id: devolucionId },
      relations: ['devolucion'],
    });
    return reembolso;
  }
}
