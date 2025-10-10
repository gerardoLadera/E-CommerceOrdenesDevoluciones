import { Module } from '@nestjs/common';
import { ReemplazoService } from './reemplazo.service';
import { ReemplazoController } from './reemplazo.controller';

@Module({
  controllers: [ReemplazoController],
  providers: [ReemplazoService],
})
export class ReemplazoModule {}
