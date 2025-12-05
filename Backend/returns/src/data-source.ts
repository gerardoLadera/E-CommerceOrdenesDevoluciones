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
  port: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT) : 5435,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'root1234',
  database: process.env.DB_DATABASE || 'returns',
  synchronize: true,
  logging: false,
  entities: [
    Devolucion,
    DevolucionHistorial,
    Reembolso,
    //Reemplazo,
    ItemDevolucion,
  ],
  migrations: [],
  subscribers: [],
});
