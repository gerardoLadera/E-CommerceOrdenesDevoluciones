import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateReemplazoDto } from './dto/create-reemplazo.dto';
import { UpdateReemplazoDto } from './dto/update-reemplazo.dto';
import { CreateBulkReemplazoDto } from './dto/create-bulk-reemplazo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Reemplazo } from './entities/reemplazo.entity';
import { Repository, DataSource } from 'typeorm';
import { Devolucion } from '../devolucion/entities/devolucion.entity';
import { ItemDevolucion } from '../items-devolucion/entities/items-devolucion.entity';
import { AccionItemDevolucion } from '../common/enums/accion-item-devolucion.enum';

@Injectable()
export class ReemplazoService {
  private readonly logger = new Logger(ReemplazoService.name);

  constructor(
    @InjectRepository(Reemplazo)
    private readonly reemplazoRepository: Repository<Reemplazo>,
    @InjectRepository(Devolucion)
    private readonly devolucionRepository: Repository<Devolucion>,
    @InjectRepository(ItemDevolucion)
    private readonly itemDevolucionRepository: Repository<ItemDevolucion>,
    private readonly dataSource: DataSource,
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

  /**
   * Buscar reemplazos por ID de devolución
   */
  async findByDevolucionId(devolucionId: string): Promise<Reemplazo[]> {
    const reemplazos = await this.reemplazoRepository.find({
      where: { devolucion_id: devolucionId },
      relations: ['devolucion', 'itemDevolucion'],
    });
    return reemplazos;
  }

  /**
   * Crear múltiples reemplazos con sus items de devolución en una transacción
   * Cada item de devolución queda vinculado 1:1 con su reemplazo
   */
  async createBulk(createBulkDto: CreateBulkReemplazoDto): Promise<{
    itemsDevolucion: ItemDevolucion[];
    reemplazos: Reemplazo[];
  }> {
    this.logger.log(
      `Creando ${createBulkDto.items.length} items de devolución con sus reemplazos para devolucion_id: ${createBulkDto.devolucion_id}`,
    );

    // Verificar que la devolución existe
    const devolucion = await this.devolucionRepository.findOne({
      where: { id: createBulkDto.devolucion_id },
    });

    if (!devolucion) {
      throw new NotFoundException(
        `Devolución con ID ${createBulkDto.devolucion_id} no encontrada`,
      );
    }

    // Usar transacción para garantizar atomicidad
    const result = await this.dataSource.transaction(async (manager) => {
      const itemsDevolucionCreados: ItemDevolucion[] = [];
      const reemplazosCreados: Reemplazo[] = [];

      // Procesar cada par item-reemplazo
      for (const itemDto of createBulkDto.items) {
        // 1. Crear el item de devolución (producto original)
        const itemDevolucion = manager.create(ItemDevolucion, {
          devolucion_id: createBulkDto.devolucion_id,
          producto_id: itemDto.producto_devuelto_id,
          cantidad: itemDto.cantidad_devuelta,
          precio_compra: itemDto.precio_compra,
          tipo_accion: AccionItemDevolucion.REEMPLAZO,
          moneda: createBulkDto.moneda,
          motivo: itemDto.motivo,
        });

        const itemGuardado = await manager.save(ItemDevolucion, itemDevolucion);
        itemsDevolucionCreados.push(itemGuardado);

        this.logger.log(
          `Item de devolución creado: ${itemGuardado.id} (producto ${itemDto.producto_devuelto_id})`,
        );

        // 2. Crear el reemplazo vinculado al item
        const reemplazo = manager.create(Reemplazo, {
          devolucion_id: createBulkDto.devolucion_id,
          item_devolucion_id: itemGuardado.id,
          producto_id: itemDto.producto_reemplazo_id,
          precio_reemplazo: itemDto.precio_reemplazo,
          ajuste_tipo: itemDto.ajuste_tipo,
          moneda: createBulkDto.moneda,
        });

        const reemplazoGuardado = await manager.save(Reemplazo, reemplazo);
        reemplazosCreados.push(reemplazoGuardado);

        this.logger.log(
          `Reemplazo creado: ${reemplazoGuardado.id} (producto ${itemDto.producto_reemplazo_id})`,
        );
      }

      return {
        itemsDevolucion: itemsDevolucionCreados,
        reemplazos: reemplazosCreados,
      };
    });

    this.logger.log(
      `✓ Transacción completada: ${result.itemsDevolucion.length} items y ${result.reemplazos.length} reemplazos creados`,
    );

    return result;
  }
}
