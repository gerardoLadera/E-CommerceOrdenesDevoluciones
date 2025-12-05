// src/devolucion-mongo/devolucion-mongo.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DevolucionMongo,
  DevolucionMongoDocument,
} from './devolucion-mongo.schema';
import { Devolucion } from '../../devolucion/entities/devolucion.entity';
// Importamos la entidad de historial para el tipado, si es necesario
// import { DevolucionHistorial } from '../../devolucion-historial/entities/devolucion-historial.entity';

@Injectable()
export class DevolucionMongoService {
  constructor(
    @InjectModel(DevolucionMongo.name)
    private devolucionModel: Model<DevolucionMongoDocument>,
  ) {}

  async createOrUpdateProjection(
    // Asegúrate de que esta entidad tenga la relación 'historial' cargada
    devolucion: Devolucion,
  ): Promise<DevolucionMongoDocument> {
    // Mapeo de Items (si están presentes)
    const itemsProjection = (devolucion.items || []).map((item) => ({
      id: item.id,
      tipo_accion: item.tipo_accion,
      producto_id_dev: item.producto_id_dev,
      precio_unitario_dev: item.precio_unitario_dev,
      cantidad_dev: item.cantidad_dev,
      producto_id_new: item.producto_id_new,
      precio_unitario_new: item.precio_unitario_new,
      cantidad_new: item.cantidad_new,
      motivo: item.motivo,
    })); // 1. Mapea la relación Historial

    // Se asume que devolucion.historial está cargado y ordenado cronológicamente.
    const historialProjection = (devolucion.historial || []).map(
      (historialEntry) => ({
        // Usamos la fecha_creacion de la entrada de historial para la marca de tiempo
        fecha_creacion: historialEntry.fecha_creacion,
        estado_nuevo: historialEntry.estado_nuevo, // Recordar que si el estado_anterior es null en PG, debe ser null en Mongo
        estado_anterior: historialEntry.estado_anterior,
        modificado_por_id: historialEntry.modificado_por_id,
      }),
    ); // 2. Estructura de los datos que se van a proyectar/actualizar (campos $set)

    const documentDataToSet = {
      // Campos de la devolución (metadata)
      codDevolucion: devolucion.codDevolucion,
      ordenId: devolucion.orden_id,
      estado: devolucion.estado, // El estado actual debe ser el más reciente
      // Colecciones/Relaciones
      items: itemsProjection,
      historial: historialProjection,
    }; // 3. Busca y actualiza, o crea si no existe (upsert)

    // Si la lista de historial está vacía, se inicializa el array en []
    // Si NO está vacía, sobrescribimos todo el array de historial con el estado actual
    // Si solo quieres agregar la última entrada, la lógica sería más compleja,
    // pero para mantener la proyección sincronizada, es mejor sobrescribir el array completo.

    return this.devolucionModel
      .findOneAndUpdate(
        { id: devolucion.id },
        {
          $set: documentDataToSet, // 💡 Establecemos el historial completo del documento de PG
          historial: historialProjection,
        },
        {
          new: true,
          upsert: true, // Importante: Asegúrate de que el objeto 'devolucion' que recibes
          // siempre incluya la relación 'historial' cargada (relations: ['historial'])
          // para que la proyección sea completa.
        },
      )
      .exec();
  }
}
