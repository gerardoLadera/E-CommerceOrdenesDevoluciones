import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentsService } from './payments.service';

@Module({
  imports: [HttpModule], // HttpModule ya es suficiente
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}