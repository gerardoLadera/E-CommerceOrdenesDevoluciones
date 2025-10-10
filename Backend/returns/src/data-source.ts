import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Devolucion } from './devolucion/entities/devolucion.entity';
import { DevolucionHistorial } from './devolucion-historial/entities/devolucion-historial.entity';
import { Reembolso } from './reembolso/entities/reembolso.entity';
import { Reemplazo } from './reemplazo/entities/reemplazo.entity';
import { ItemDevolucion } from './items-devolucion/entities/items-devolucion.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT) : 5432,
  username: process.env.DB_USERNAME || 'test',
  password: process.env.DB_PASSWORD || 'test',
  database: process.env.DB_DATABASE || 'test',
  synchronize: true,
  logging: false,
  entities: [
    Devolucion,
    DevolucionHistorial,
    Reembolso,
    Reemplazo,
    ItemDevolucion,
  ],
  migrations: [],
  subscribers: [],
});
