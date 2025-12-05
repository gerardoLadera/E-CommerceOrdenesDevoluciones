// src/devolucion-mongo/devolucion-mongo.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DevolucionMongo,
  DevolucionMongoSchema,
} from './devolucion-mongo.schema';
import { DevolucionMongoService } from './devolucion-mongo.service';

@Module({
  imports: [
    // 1. Registra el esquema de Mongoose para este módulo
    MongooseModule.forFeature([
      { name: DevolucionMongo.name, schema: DevolucionMongoSchema },
    ]),
  ],
  providers: [DevolucionMongoService],
  // 2. EXPORTA el servicio para que otros módulos (DevolucionModule) lo puedan inyectar
  exports: [DevolucionMongoService],
})
export class DevolucionMongoModule {}
