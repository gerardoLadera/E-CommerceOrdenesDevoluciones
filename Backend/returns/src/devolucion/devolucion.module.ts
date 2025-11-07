import { Module } from '@nestjs/common';
import { DevolucionService } from './devolucion.service';
import { DevolucionController } from './devolucion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Devolucion } from './entities/devolucion.entity';
import { KafkaproviderModule } from '../common/kafka/kafkaprovider.module';
import { OrdersModule } from './order/order.module';
import { PaymentsModule } from '../payments/payments.module';
import { ReembolsoModule } from '../reembolso/reembolso.module';
import { ItemDevolucion } from '../items-devolucion/entities/items-devolucion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Devolucion, ItemDevolucion]), KafkaproviderModule,OrdersModule,PaymentsModule,ReembolsoModule,],
  controllers: [DevolucionController],
  providers: [DevolucionService],
  exports: [DevolucionService],
})
export class DevolucionModule {}
