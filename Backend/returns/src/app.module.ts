import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevolucionModule } from './devolucion/devolucion.module';
import { ReembolsoModule } from './reembolso/reembolso.module';
import { ItemsDevolucionModule } from './items-devolucion/items-devolucion.module';
import { ReemplazoModule } from './reemplazo/reemplazo.module';
import { DevolucionHistorialModule } from './devolucion-historial/devolucion-historial.module';

@Module({
  imports: [
    DevolucionModule,
    ReembolsoModule,
    ItemsDevolucionModule,
    ReemplazoModule,
    DevolucionHistorialModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
