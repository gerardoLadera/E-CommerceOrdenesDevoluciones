import { Module } from '@nestjs/common';
import { DevolucionHistorialService } from './devolucion-historial.service';
import { DevolucionHistorialController } from './devolucion-historial.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevolucionHistorial } from './entities/devolucion-historial.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DevolucionHistorial])],
  controllers: [DevolucionHistorialController],
  providers: [DevolucionHistorialService],
  exports: [DevolucionHistorialService],
})
export class DevolucionHistorialModule {}
