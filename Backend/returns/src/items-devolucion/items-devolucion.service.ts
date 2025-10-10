// src/items-devolucion/items-devolucion.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemDevolucion } from './entities/items-devolucion.entity';
import { CreateItemsDevolucionDto } from './dto/create-items-devolucion.dto';
import { UpdateItemsDevolucionDto } from './dto/update-items-devolucion.dto';

@Injectable()
export class ItemsDevolucionService {
  constructor(
    @InjectRepository(ItemDevolucion)
    private readonly itemRepository: Repository<ItemDevolucion>,
  ) {}

  async create(createItemsDevolucionDto: CreateItemsDevolucionDto) {
    const item = this.itemRepository.create(createItemsDevolucionDto);
    return await this.itemRepository.save(item);
  }

  async findAll() {
    return await this.itemRepository.find({
      relations: ['devolucion', 'reemplazo'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: string) {
    const item = await this.itemRepository.findOne({
      where: { id },
      relations: ['devolucion', 'reemplazo'],
    });
    if (!item)
      throw new NotFoundException(`Item de devolución ${id} no encontrado`);
    return item;
  }

  async update(id: string, updateItemsDevolucionDto: UpdateItemsDevolucionDto) {
    const item = await this.findOne(id);
    Object.assign(item, updateItemsDevolucionDto);
    return await this.itemRepository.save(item);
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    return await this.itemRepository.remove(item);
  }
}
