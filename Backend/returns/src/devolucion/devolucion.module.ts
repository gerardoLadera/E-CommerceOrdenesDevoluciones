import { Module } from '@nestjs/common';
import { DevolucionService } from './devolucion.service';
import { DevolucionController } from './devolucion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Devolucion } from './entities/devolucion.entity';
import { DevolucionHistorial } from '../devolucion-historial/entities/devolucion-historial.entity';
import { KafkaproviderModule } from '../common/kafka/kafkaprovider.module';
import { OrdersModule } from './order/order.module';
import { PaymentsModule } from '../payments/payments.module';
import { ReembolsoModule } from '../reembolso/reembolso.module';
import { ItemDevolucion } from '../items-devolucion/entities/items-devolucion.entity';
import { InstruccionesDevolucionService } from './services/instrucciones-devolucion.service';
import { HttpModule } from '@nestjs/axios';
import { NotificationService } from '../common/services/notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Devolucion, ItemDevolucion, DevolucionHistorial]),
    HttpModule,
    KafkaproviderModule,
    OrdersModule,
    PaymentsModule,
    ReembolsoModule,
  ],
  controllers: [DevolucionController],
  providers: [DevolucionService, InstruccionesDevolucionService, NotificationService],
  exports: [DevolucionService],
})
export class DevolucionModule {}
