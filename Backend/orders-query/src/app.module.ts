import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from './kafka/kafka.module';
import { OrdersModule } from './orders/orders.module';
import { MongoModule } from './mongo/mongo.module';
import { DevolucionesModule } from './devoluciones/devoluciones.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.development.local',
      isGlobal: true,
    }),
    KafkaModule,
    OrdersModule,
    MongoModule,
    DevolucionesModule,
  ],
})
export class AppModule {}
