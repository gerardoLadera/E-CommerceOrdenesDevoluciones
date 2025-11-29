// src/items-devolucion/items-devolucion.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemDevolucion } from './entities/items-devolucion.entity';
import { CreateItemsDevolucionDto } from './dto/create-items-devolucion.dto';
import { UpdateItemsDevolucionDto } from './dto/update-items-devolucion.dto';
import { CreateMultipleItemsDevolucionDto } from './dto/create-multiple-items-devolucion.dto';

@Injectable()
export class ItemsDevolucionService {
  private readonly logger = new Logger(ItemsDevolucionService.name);

  constructor(
    @InjectRepository(ItemDevolucion)
    private readonly itemRepository: Repository<ItemDevolucion>,
  ) {}

  /**
   * Crear un único item de devolución
   */
  async create(createItemsDevolucionDto: CreateItemsDevolucionDto) {
    const item = this.itemRepository.create(createItemsDevolucionDto);
    return await this.itemRepository.save(item);
  }

  /**
   * Crear múltiples items de devolución para una misma devolución
   * Utiliza una transacción para garantizar atomicidad
   */
  async createMultiple(
    createMultipleDto: CreateMultipleItemsDevolucionDto,
  ): Promise<ItemDevolucion[]> {
    this.logger.log(
      `Creando ${createMultipleDto.items.length} items para la devolución ${createMultipleDto.devolucion_id}`,
    );

    // Mapear los items agregando el devolucion_id a cada uno
    const itemsToCreate = createMultipleDto.items.map((item) => ({
      ...item,
      devolucion_id: createMultipleDto.devolucion_id,
    }));

    // Crear las entidades
    const entities = this.itemRepository.create(itemsToCreate);

    // Guardar todos los items de una vez (usa transacción interna de TypeORM)
    const savedItems = await this.itemRepository.save(entities);

    this.logger.log(
      `${savedItems.length} items creados exitosamente para la devolución ${createMultipleDto.devolucion_id}`,
    );

    return savedItems;
  }

  /**
   * Crear múltiples items en bulk (alternativa más optimizada)
   * Usa insert en lugar de save para mejor performance
   */
  async createBulk(items: CreateItemsDevolucionDto[]): Promise<ItemDevolucion[]> {
    this.logger.log(`Insertando ${items.length} items en bulk`);

    // Insertar todos los registros de una vez
    const result = await this.itemRepository.insert(items);

    // Obtener los IDs insertados y recuperar las entidades completas
    const insertedIds = result.identifiers.map((id) => id.id);
    const insertedItems = await this.itemRepository.find({
      where: insertedIds.map(id => ({ id })),
    });

    this.logger.log(`${insertedItems.length} items insertados exitosamente`);

    return insertedItems;
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
