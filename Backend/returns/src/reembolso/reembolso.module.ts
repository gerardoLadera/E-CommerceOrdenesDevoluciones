import { Module } from '@nestjs/common';
import { ReembolsoService } from './reembolso.service';
import { ReembolsoController } from './reembolso.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reembolso } from './entities/reembolso.entity';
import { Devolucion } from '../devolucion/entities/devolucion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reembolso, Devolucion])],
  controllers: [ReembolsoController],
  providers: [ReembolsoService],
  exports: [ReembolsoService],
})
export class ReembolsoModule {}
