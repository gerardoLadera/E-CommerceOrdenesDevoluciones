import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoService } from '../mongo/mongo.service';
import { OrderSummaryDto } from './dto/order-summary.dto';
import { OrderDetailDto } from './dto/order-detail.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly mongoService: MongoService) {}

async findAllByUser(usuarioId: string, page = 1, limit = 10): Promise<{
  data: OrderSummaryDto[];
  total: number;
  page: number;
  lastPage: number;
}> {

  const safePage = Math.max(1, page);

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
    .skip((safePage - 1) * limit)
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
    page: safePage,
    lastPage: Math.ceil(total / limit),
  };
}

async findOneById(id: string): Promise<OrderDetailDto> {
  const collection = this.mongoService.getCollection('ordenes');
  const order = await collection.findOne({ $or: [{ _id: id }, { cod_orden: id }] });

  if (!order) {
    throw new NotFoundException(`Orden con ID ${id} no encontrada`);
  }

  const orderDetail: OrderDetailDto = {
    cod_orden: order.cod_orden,
    estado: order.estado,
    fechaCreacion: order.fechaCreacion,
    fechaActualizacion: order.fechaActualizacion,
    costos: {
      subtotal: order.costos?.subtotal ?? 0,
      envio: order.costos?.envio ?? 0,
      total: order.costos?.total ?? 0,
    },
    items: (order.items ?? []).map(item => ({
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subTotal: item.subTotal,
      detalleProducto: {
        nombre: item.detalle_producto?.nombre ?? 'N/A',
        marca: item.detalle_producto?.marca ?? 'N/A',
        descripcion: item.detalle_producto?.descripcion ?? '',
        modelo: item.detalle_producto?.modelo ?? '',
        imagen: item.detalle_producto?.imagen ?? '',
      },
    })),
    direccionEnvio: {
      nombreCompleto: order.direccionEnvio?.nombreCompleto ?? 'N/A',
      direccionLinea1: order.direccionEnvio?.direccionLinea1 ?? 'N/A',
      ciudad: order.direccionEnvio?.ciudad ?? 'N/A',
      pais: order.direccionEnvio?.pais ?? 'N/A',
    },
    metodoPago: order.metodoPago,
    usuarioId: order.usuarioId,
  };

  return orderDetail;
}
}
