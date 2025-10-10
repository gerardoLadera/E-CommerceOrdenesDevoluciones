import { Module } from '@nestjs/common';
import { DevolucionService } from './devolucion.service';
import { DevolucionController } from './devolucion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Devolucion } from './entities/devolucion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Devolucion])],
  controllers: [DevolucionController],
  providers: [DevolucionService],
  exports: [DevolucionService],
})
export class DevolucionModule {}
