// src/devolucion-mongo/devolucion-mongo.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

// Definición del Sub-esquema (ItemDevolucion)
@Schema()
export class ItemDevolucionMongo {
  @Prop({ required: true })
  id: string;

  @Prop()
  tipo_accion: string; // 'reembolso' o 'reemplazo'

  @Prop()
  producto_id_dev: number;

  @Prop()
  precio_unitario_dev: number;

  @Prop()
  cantidad_dev: number;

  @Prop()
  producto_id_new: number; // Para reemplazo

  @Prop()
  precio_unitario_new: number; // Para reemplazo

  @Prop()
  cantidad_new: number; // Para reemplazo

  @Prop()
  motivo: string;
}
export const ItemDevolucionMongoSchema =
  SchemaFactory.createForClass(ItemDevolucionMongo);

// Esquema principal (DevolucionMongo)
export type DevolucionMongoDocument = DevolucionMongo & Document;

@Schema({
  collection: 'devoluciones',
  timestamps: true,
  versionKey: false,
})
export class DevolucionMongo {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true })
  ordenId: string;

  @Prop()
  codDevolucion: string;

  @Prop({ required: true })
  estado: string;

  @Prop({ type: [ItemDevolucionMongoSchema] })
  items: ItemDevolucionMongo[];
}

export const DevolucionMongoSchema =
  SchemaFactory.createForClass(DevolucionMongo);
