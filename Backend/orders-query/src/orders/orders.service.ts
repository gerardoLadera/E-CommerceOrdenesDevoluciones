import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoService } from '../mongo/mongo.service';
import { OrderSummaryDto } from './dto/order-summary.dto';
import { OrderAdminSummaryDto } from './dto/order-admin';

@Injectable()
export class OrdersService {
  constructor(private readonly mongoService: MongoService) {}

async findAllByUser(usuarioId: number, page = 1, limit = 5,filter = 'todos',search=''): Promise<{
  data: OrderSummaryDto[];
  total: number;
  page: number;
  lastPage: number;
}> {
  const collection = this.mongoService.getCollection('ordenes');

  const query: any = { usuarioId };

    //  Filtros de fecha
    const now = new Date();
    if (filter === 'mes-actual') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      query.fechaCreacion = { $gte: start };
    } else if (filter === 'mes-pasado') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      query.fechaCreacion = { $gte: start, $lt: end };
    } else if (filter === 'anio-actual') {
      const start = new Date(now.getFullYear(), 0, 1);
      query.fechaCreacion = { $gte: start };
    } else if (/^\d{4}$/.test(filter)) {
      // Año específico 
      const year = parseInt(filter, 10);
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);
      query.fechaCreacion = { $gte: start, $lt: end };
    }

    // Filtro de búsqueda (por código de orden o nombre de producto)
    if (search && search.trim() !== '') {
      query.$or = [
        { cod_orden: { $regex: search, $options: 'i' } },
        { 'items.detalle_producto.nombre': { $regex: search, $options: 'i' } },
      ];
    }



  const cursor = collection.find(query)
    .project({
      _id: 1,
      cod_orden: 1,
      estado: 1,
      fechaCreacion: 1,
      fechaActualizacion: 1,
      'costos.total': 1,
      'items.detalle_producto.imagen': 1,
      'items.cantidad': 1,
      'entrega.tipo': 1,
      'entrega.fechaEntregaEstimada': 1,
      'entrega.carrierSeleccionado.fecha_entrega_estimada': 1
    })
    .sort({ fechaCreacion: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const rawData = await cursor.toArray();
  const total = await collection.countDocuments(query);

  const mapped: OrderSummaryDto[] = rawData.map(doc => {
    let fechaEntregaEstimada: Date | null = null;
  
    if (doc.entrega?.tipo === 'RECOJO_TIENDA') {
      fechaEntregaEstimada = doc.entrega?.fechaEntregaEstimada
        ? new Date(doc.entrega.fechaEntregaEstimada)
        : null;
    } else if (doc.entrega?.tipo === 'DOMICILIO') {
      fechaEntregaEstimada = doc.entrega?.carrierSeleccionado?.fecha_entrega_estimada
        ? new Date(doc.entrega.carrierSeleccionado.fecha_entrega_estimada)
        : null;
    }

    return {
      _id: doc._id,
      cod_orden: doc.cod_orden,
      estado: doc.estado,
      fechaCreacion: doc.fechaCreacion,
      fechaActualizacion: doc.fechaActualizacion,
      total: doc.costos?.total ?? 0,
      imagenes: (doc.items ?? []).map(item => ({
        imagen: item.detalle_producto?.imagen ?? null,
        cantidad: item.cantidad
      })),
      fechaEntregaEstimada
    };
  });

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


async findAll(params:{
  page: number;
  limit: number;
  busquedaId?: string;
  busquedaCliente?: string;
  estado?: string;
  tieneDevolucion?: string;
  fechaInicio?: string;
  fechaFin?: string;
}): Promise<{
  data: OrderAdminSummaryDto[];
  total: number;
  page: number;
  lastPage: number;
}> {
  const collection = this.mongoService.getCollection('ordenes');

   //Query  para los filtros
  const query: any = {};

  if (params.busquedaId) {
    query.cod_orden = params.busquedaId; 
  }
  if (params.busquedaCliente) {
    query['direccionEnvio.nombreCompleto'] = { $regex: params.busquedaCliente, $options: 'i' };
  }
  if (params.estado) {
    query.estado = params.estado;
  }
  if (params.tieneDevolucion) {
    query.tiene_devolucion = params.tieneDevolucion === 'true';
  }
  if (params.fechaInicio || params.fechaFin) {
    query.fechaCreacion = {};
    // if (params.fechaInicio) query.fechaCreacion.$gte = new Date(params.fechaInicio);
    // if (params.fechaFin) query.fechaCreacion.$lte = new Date(params.fechaFin);
    if (params.fechaInicio) {
      const start = new Date(params.fechaInicio);
      start.setUTCHours(0, 0, 0, 0); // inicio del día en UTC
      query.fechaCreacion.$gte = start;
    }
    if (params.fechaFin) {
      const end = new Date(params.fechaFin);
      end.setUTCHours(23, 59, 59, 999); // fin del día en UTC
      query.fechaCreacion.$lte = end;
    }
  }


  const cursor = collection.find(query)
    .project({
      _id: 1,
      cod_orden: 1,
      estado: 1,
      fechaCreacion: 1,
      'direccionEnvio.nombreCompleto': 1,
      'costos.total': 1,
      tiene_devolucion: 1
    })
    .sort({ fechaCreacion: -1 })
    .skip((params.page - 1) * params.limit)
    .limit(params.limit);  

  const rawData = await cursor.toArray();
  const total = await collection.countDocuments(query);

  const mapped: OrderAdminSummaryDto[] = rawData.map(doc => ({
    _id: doc._id,
    cod_orden: doc.cod_orden,
    nombre: doc.direccionEnvio?.nombreCompleto ?? '—',
    fechaCreacion: doc.fechaCreacion,
    estado: doc.estado,
    tiene_devolucion: doc.tiene_devolucion ?? false,
    total: doc.costos?.total ?? 0
  }));

  return {
    data: mapped,
    total,
    page:params.page,
    lastPage: Math.ceil(total / params.limit),
  };
}






}

