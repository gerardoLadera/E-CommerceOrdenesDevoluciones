import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoService } from '../mongo/mongo.service';

@Injectable()
export class OrdersService {
  constructor(private readonly mongoService: MongoService) {}

  async findAllByUser(clienteId: string, page = 1, limit = 10) {
    const collection = this.mongoService.getCollection('ordenes');
    const cursor = collection.find({clienteId: clienteId })
      .sort({ fechaCreacion: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const data = await cursor.toArray();
    const total = await collection.countDocuments({ clienteId: clienteId });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOneById(id: string) {
  const collection = this.mongoService.getCollection('ordenes');
  const order = await collection.findOne({ _id: id });

  if (!order) {
    throw new NotFoundException(`Orden con ID ${id} no encontrada`);
  }

    return order;
  }
}

