import { Module } from '@nestjs/common';
import { DevolucionService } from './devolucion.service';
import { DevolucionController } from './devolucion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Devolucion } from './entities/devolucion.entity';
import { DevolucionHistorial } from '../devolucion-historial/entities/devolucion-historial.entity';
import { KafkaproviderModule } from '../common/kafka/kafkaprovider.module';
import { OrdersModule } from './order/order.module';
import { InstruccionesDevolucionService } from './services/instrucciones-devolucion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Devolucion, DevolucionHistorial]),
    KafkaproviderModule,
    OrdersModule,
  ],
  controllers: [DevolucionController],
  providers: [DevolucionService, InstruccionesDevolucionService],
  exports: [DevolucionService],
})
export class DevolucionModule {}
