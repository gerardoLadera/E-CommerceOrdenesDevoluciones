import { DataSource } from 'typeorm';
import 'dotenv/config';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/src/entities/*.js'],
  migrations: [__dirname + '/src/migrations/*.js'],
  synchronize: false,
  logging: ['query', 'error'], 
});

export default AppDataSource;