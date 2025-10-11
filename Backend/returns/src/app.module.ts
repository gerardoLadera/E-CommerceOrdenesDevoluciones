import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevolucionModule } from './devolucion/devolucion.module';
import { ReembolsoModule } from './reembolso/reembolso.module';
import { ItemsDevolucionModule } from './items-devolucion/items-devolucion.module';
import { ReemplazoModule } from './reemplazo/reemplazo.module';
import { DevolucionHistorialModule } from './devolucion-historial/devolucion-historial.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.development.local',
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'returns-db',
      port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [],
      synchronize: true,
    }),
    DevolucionModule,
    ReembolsoModule,
    ItemsDevolucionModule,
    ReemplazoModule,
    DevolucionHistorialModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
