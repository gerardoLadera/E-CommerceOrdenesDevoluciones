import { Module } from '@nestjs/common';
import { DevolucionHistorialService } from './devolucion-historial.service';
import { DevolucionHistorialController } from './devolucion-historial.controller';

@Module({
  controllers: [DevolucionHistorialController],
  providers: [DevolucionHistorialService],
})
export class DevolucionHistorialModule {}
