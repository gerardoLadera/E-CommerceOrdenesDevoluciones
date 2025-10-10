import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoService } from '../mongo/mongo.service';
import { OrderSummaryDto } from './dto/order-summary.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly mongoService: MongoService) {}

async findAllByUser(usuarioId: string, page = 1, limit = 10): Promise<{
  data: OrderSummaryDto[];
  total: number;
  page: number;
  lastPage: number;
}> {
  const collection = this.mongoService.getCollection('ordenes');
  const cursor = collection.find({ usuarioId })
    .project({
      _id: 1,
      cod_orden: 1,
      estado: 1,
      fechaCreacion: 1,
      fechaActualizacion: 1,
      'costos.total': 1,
      'items.detalle_producto.imagen': 1,
      'items.cantidad': 1
    })
    .sort({ fechaCreacion: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const rawData = await cursor.toArray();
  const total = await collection.countDocuments({ usuarioId });

  const mapped: OrderSummaryDto[] = rawData.map(doc => ({
    _id: doc._id,
    cod_orden: doc.cod_orden,
    estado: doc.estado,
    fechaCreacion: doc.fechaCreacion,
    fechaActualizacion: doc.fechaActualizacion,
    total: doc.costos?.total ?? 0,
    imagenes: (doc.items ?? []).map(item => ({
      imagen: item.detalle_producto?.imagen ?? null,
      cantidad: item.cantidad
    }))
  }));

  return {
    data: mapped,
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

