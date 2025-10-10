import { Module } from '@nestjs/common';
import { ItemsDevolucionService } from './items-devolucion.service';
import { ItemsDevolucionController } from './items-devolucion.controller';

@Module({
  controllers: [ItemsDevolucionController],
  providers: [ItemsDevolucionService],
})
export class ItemsDevolucionModule {}
