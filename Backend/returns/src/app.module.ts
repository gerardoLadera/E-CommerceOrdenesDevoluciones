import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevolucionModule } from './devolucion/devolucion.module';
import { ReembolsoModule } from './reembolso/reembolso.module';
import { ItemsDevolucionModule } from './items-devolucion/items-devolucion.module';
//import { ReemplazoModule } from './reemplazo/reemplazo.module';
import { DevolucionHistorialModule } from './devolucion-historial/devolucion-historial.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { Devolucion } from './devolucion/entities/devolucion.entity';
import { DevolucionHistorial } from './devolucion-historial/entities/devolucion-historial.entity';
import { ItemDevolucion } from './items-devolucion/entities/items-devolucion.entity';
import { Reembolso } from './reembolso/entities/reembolso.entity';
//import { Reemplazo } from './reemplazo/entities/reemplazo.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env.development.local'],
      isGlobal: true,
    }),

    // 1. CONEXIÓN A MONGODB USANDO LA URI DE TU .env
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),

    // 2. CONEXIÓN A POSTGRESQL (EXISTENTE)
    TypeOrmModule.forRoot({
      type: 'postgres',
      //host: process.env.DB_HOST ?? 'returns-db',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number.parseInt(process.env.DB_PORT ?? '5435', 10),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'root1234',
      database: process.env.DB_DATABASE ?? 'returns',
      entities: [
        Devolucion,
        DevolucionHistorial,
        ItemDevolucion,
        Reembolso,
        //Reemplazo,
      ],
      synchronize: true,
      ssl: false,
    }),
    DevolucionModule,
    ReembolsoModule,
    ItemsDevolucionModule,
    //ReemplazoModule,
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
