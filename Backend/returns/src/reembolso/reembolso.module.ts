import { Module } from '@nestjs/common';
import { ReembolsoService } from './reembolso.service';
import { ReembolsoController } from './reembolso.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reembolso } from './entities/reembolso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reembolso])],
  controllers: [ReembolsoController],
  providers: [ReembolsoService],
  exports: [ReembolsoService],
})
export class ReembolsoModule {}
