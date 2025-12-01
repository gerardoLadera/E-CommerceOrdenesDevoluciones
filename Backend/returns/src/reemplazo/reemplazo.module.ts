import { Module } from '@nestjs/common';
import { ReemplazoService } from './reemplazo.service';
import { ReemplazoController } from './reemplazo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reemplazo } from './entities/reemplazo.entity';
import { Devolucion } from '../devolucion/entities/devolucion.entity';
import { ItemDevolucion } from '../items-devolucion/entities/items-devolucion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reemplazo, Devolucion, ItemDevolucion])],
  controllers: [ReemplazoController],
  providers: [ReemplazoService],
  exports: [ReemplazoService],
})
export class ReemplazoModule {}
