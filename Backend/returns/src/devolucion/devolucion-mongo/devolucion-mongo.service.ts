// src/devolucion-mongo/devolucion-mongo.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DevolucionMongo,
  DevolucionMongoDocument,
} from './devolucion-mongo.schema';
import { Devolucion } from '../../devolucion/entities/devolucion.entity';

@Injectable()
export class DevolucionMongoService {
  constructor(
    @InjectModel(DevolucionMongo.name)
    private devolucionModel: Model<DevolucionMongoDocument>,
  ) {}

  async createOrUpdateProjection(
    devolucion: Devolucion,
  ): Promise<DevolucionMongoDocument> {
    // 1. Mapea la entidad de PostgreSQL a la estructura de MongoDB
    const documentData = {
      id: devolucion.id,
      //ordenId: devolucion.orden_id,
      codDevolucion: devolucion.codDevolucion,
      //createdAt: devolucion.createdAt,
      estado: devolucion.estado,
      //codDevolucion: devolucion.codDevolucion,
      //correlativo: devolucion.correlativo,
      //orden_reemplazo_id: devolucion.orden_reemplazo_id,
      //reembolso: devolucion.reembolso,
      items: devolucion.items || [],
    };

    // 2. Busca y actualiza, o crea si no existe (upsert)
    return this.devolucionModel
      .findOneAndUpdate(
        { id: documentData.id },
        { $set: documentData },
        {
          new: true,
          upsert: true,
        },
      )
      .exec();
  }
}
