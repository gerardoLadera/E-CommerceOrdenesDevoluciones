import { Module } from '@nestjs/common';
import { ItemsDevolucionService } from './items-devolucion.service';
import { ItemsDevolucionController } from './items-devolucion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemDevolucion } from './entities/items-devolucion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ItemDevolucion])],
  controllers: [ItemsDevolucionController],
  providers: [ItemsDevolucionService],
  exports: [ItemsDevolucionService],
})
export class ItemsDevolucionModule {}
