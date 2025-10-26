import { Module } from '@nestjs/common';
import { DevolucionService } from './devolucion.service';
import { DevolucionController } from './devolucion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Devolucion } from './entities/devolucion.entity';
import { KafkaproviderModule } from '../common/kafka/kafkaprovider.module';
import { OrdersModule } from './order/order.module';

@Module({
  imports: [TypeOrmModule.forFeature([Devolucion]), KafkaproviderModule,OrdersModule,],
  controllers: [DevolucionController],
  providers: [DevolucionService],
  exports: [DevolucionService],
})
export class DevolucionModule {}
