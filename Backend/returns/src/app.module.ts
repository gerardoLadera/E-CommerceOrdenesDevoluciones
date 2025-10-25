import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevolucionModule } from './devolucion/devolucion.module';
import { ReembolsoModule } from './reembolso/reembolso.module';
import { ItemsDevolucionModule } from './items-devolucion/items-devolucion.module';
import { ReemplazoModule } from './reemplazo/reemplazo.module';
import { DevolucionHistorialModule } from './devolucion-historial/devolucion-historial.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { Devolucion } from './devolucion/entities/devolucion.entity';
import { DevolucionHistorial } from './devolucion-historial/entities/devolucion-historial.entity';
import { ItemDevolucion } from './items-devolucion/entities/items-devolucion.entity';
import { Reembolso } from './reembolso/entities/reembolso.entity';
import { Reemplazo } from './reemplazo/entities/reemplazo.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development', 'env.development.local'],
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'returns-db',
      port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_DATABASE ?? 'returns',
      entities: [
        Devolucion,
        DevolucionHistorial,
        ItemDevolucion,
        Reembolso,
        Reemplazo,
      ],
      synchronize: true,
      ssl: false,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
