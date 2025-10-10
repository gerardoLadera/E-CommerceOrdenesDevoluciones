import { Module } from '@nestjs/common';
import { DevolucionService } from './devolucion.service';
import { DevolucionController } from './devolucion.controller';

@Module({
  controllers: [DevolucionController],
  providers: [DevolucionService],
})
export class DevolucionModule {}
