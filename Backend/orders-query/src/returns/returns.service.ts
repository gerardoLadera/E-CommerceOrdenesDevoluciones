import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoService } from '../mongo/mongo.service';

@Injectable()
export class ReturnsService {
  constructor(private readonly mongoService: MongoService) {}

  /**
   * Obtener todas las devoluciones con paginación
   */
  async findAll(page = 1, limit = 10): Promise<{
    data: any[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const collection = this.mongoService.getCollection('devoluciones');

    const cursor = collection
      .find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const data = await cursor.toArray();
    const total = await collection.countDocuments({});
    const lastPage = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      lastPage,
    };
  }

  /**
   * Obtener una devolución por su ID
   */
  async findOneById(id: string): Promise<any> {
    const collection = this.mongoService.getCollection('devoluciones');
    const devolucion = await collection.findOne({ id });

    if (!devolucion) {
      throw new NotFoundException(`Devolución con ID ${id} no encontrada`);
    }

    return devolucion;
  }

  /**
   * Obtener devoluciones por orden_id
   */
  async findByOrderId(ordenId: string): Promise<any[]> {
    const collection = this.mongoService.getCollection('devoluciones');
    const devoluciones = await collection
      .find({ orden_id: ordenId })
      .sort({ createdAt: -1 })
      .toArray();

    return devoluciones;
  }

  /**
   * Obtener devoluciones por estado
   */
  async findByEstado(estado: string, page = 1, limit = 10): Promise<{
    data: any[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const collection = this.mongoService.getCollection('devoluciones');

    const query = { estado };
    const cursor = collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const data = await cursor.toArray();
    const total = await collection.countDocuments(query);
    const lastPage = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      lastPage,
    };
  }
}
