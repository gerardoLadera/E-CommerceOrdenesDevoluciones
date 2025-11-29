import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoService } from '../mongo/mongo.service';
import { OrderSummaryDto } from './dto/order-summary.dto';
import { OrderAdminSummaryDto } from './dto/order-admin';

@Injectable()
export class OrdersService {
  constructor(private readonly mongoService: MongoService) {}

  async findAllByUser(
    usuarioId: number,
    page = 1,
    limit = 5,
  ): Promise<{
    data: OrderSummaryDto[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const collection = this.mongoService.getCollection('ordenes');
    const cursor = collection
      .find({ usuarioId })
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
        'entrega.carrierSeleccionado.fecha_entrega_estimada': 1,
      })
      .sort({ fechaCreacion: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const rawData = await cursor.toArray();
    const total = await collection.countDocuments({ usuarioId });

    const mapped: OrderSummaryDto[] = rawData.map((doc: any) => {
      let fechaEntregaEstimada: Date | null = null;

      if (doc.entrega?.tipo === 'RECOJO_TIENDA') {
        fechaEntregaEstimada = doc.entrega?.fechaEntregaEstimada
          ? new Date(doc.entrega.fechaEntregaEstimada)
          : null;
      } else if (doc.entrega?.tipo === 'DOMICILIO') {
        fechaEntregaEstimada = doc.entrega?.carrierSeleccionado
          ?.fecha_entrega_estimada
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
        imagenes: (doc.items ?? []).map((item: any) => ({
          imagen: item.detalle_producto?.imagen ?? null,
          cantidad: item.cantidad,
        })),
        fechaEntregaEstimada,
        tiene_devolucion: doc.tiene_devolucion ?? false, // Asumiendo que se agregó al DTO
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

  /**
   * ✅ MÉTODO FINDALL UNIFICADO CON FILTROS PARA ADMINISTRACIÓN
   */
  async findAll(params: {
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

    // Query para los filtros
    const query: any = {};

    if (params.busquedaId) {
      query.cod_orden = params.busquedaId;
    }
    if (params.busquedaCliente) {
      query['direccionEnvio.nombreCompleto'] = {
        $regex: params.busquedaCliente,
        $options: 'i',
      };
    }
    if (params.estado) {
      query.estado = params.estado;
    }
    if (params.tieneDevolucion) {
      query.tiene_devolucion = params.tieneDevolucion === 'true';
    }
    if (params.fechaInicio || params.fechaFin) {
      query.fechaCreacion = {};
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

    const cursor = collection
      .find(query)
      .project({
        _id: 1,
        cod_orden: 1,
        estado: 1,
        fechaCreacion: 1,
        'direccionEnvio.nombreCompleto': 1,
        'costos.total': 1,
        tiene_devolucion: 1,
      })
      .sort({ fechaCreacion: -1 })
      .skip((params.page - 1) * params.limit)
      .limit(params.limit);

    const rawData = await cursor.toArray();
    const total = await collection.countDocuments(query);

    const mapped: OrderAdminSummaryDto[] = rawData.map((doc: any) => ({
      _id: doc._id,
      cod_orden: doc.cod_orden,
      nombre: doc.direccionEnvio?.nombreCompleto ?? '—',
      fechaCreacion: doc.fechaCreacion,
      estado: doc.estado,
      tiene_devolucion: doc.tiene_devolucion ?? false,
      total: doc.costos?.total ?? 0,
    }));

    return {
      data: mapped,
      total,
      page: params.page,
      lastPage: Math.ceil(total / params.limit),
    };
  }

  /**
   * ✅ MÉTODO PARA ACTUALIZAR BANDERA DE DEVOLUCIÓN (ECO-118)
   */
  async updateOrderFlagForReturnNew(orderId: string, returnId: string) {
    const collection = this.mongoService.getCollection('ordenes');

    // 1. Opcional: Obtener la orden actual para obtener el estado y el historial
    const order = await collection.findOne({ _id: orderId });
    if (!order) {
      // En un consumer, no queremos lanzar una excepción que detenga el servicio,
      // pero sí lo haremos para que el test unitario lo capture.
      throw new NotFoundException(`Orden con ID ${orderId} no encontrada.`);
    }

    // 2. Actualizar la orden
    const updateResult = await collection.updateOne(
      { _id: orderId },
      {
        $set: {
          tiene_devolucion: true, // Establece la bandera de devolución en true
          id_devolucion: returnId, // Opcionalmente guarda el ID de la primera devolución
          fechaActualizacion: new Date().toISOString(),
        },
        $push: {
          // Agregar un registro al historial (opcional, pero buena práctica)
          historial: {
            estadoAnterior: order.estado,
            estadoNuevo: order.estado, // El estado no cambia con la solicitud de devolución
            fechaModificacion: new Date().toISOString(),
            modificadoPor: 'Sistema Devoluciones',
            motivo: `Devolución ${returnId} solicitada. Bandera 'tiene_devolucion' activada.`,
          },
        },
      },
    );

    console.log(
      `Orden ${orderId} actualizada. Coincidencias: ${updateResult.matchedCount}, Modificados: ${updateResult.modifiedCount}`,
    );

    return updateResult;
  }
}
