import { Module } from '@nestjs/common';
import { DevolucionesController } from './devoluciones.controller';
import { DevolucionesService } from './devoluciones.service';
import { MongoModule } from '../mongo/mongo.module';

@Module({
  imports: [MongoModule], // Usamos tu MongoModule
  controllers: [DevolucionesController],
  providers: [DevolucionesService],
})
export class DevolucionesModule {}
