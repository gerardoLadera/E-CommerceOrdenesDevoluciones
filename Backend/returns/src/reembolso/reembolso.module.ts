import { Module } from '@nestjs/common';
import { ReembolsoService } from './reembolso.service';
import { ReembolsoController } from './reembolso.controller';

@Module({
  controllers: [ReembolsoController],
  providers: [ReembolsoService],
})
export class ReembolsoModule {}
