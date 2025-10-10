import { Module } from '@nestjs/common';
import { ReemplazoService } from './reemplazo.service';
import { ReemplazoController } from './reemplazo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reemplazo } from './entities/reemplazo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reemplazo])],
  controllers: [ReemplazoController],
  providers: [ReemplazoService],
  exports: [ReemplazoService],
})
export class ReemplazoModule {}
