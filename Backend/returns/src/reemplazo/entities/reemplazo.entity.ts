// src/reemplazo/entities/reemplazo.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Devolucion } from '../../devolucion/entities/devolucion.entity';
import { ItemDevolucion } from '../../items-devolucion/entities/items-devolucion.entity';

@Entity('reemplazo')
export class Reemplazo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  devolucion_id: string;

  @Column('uuid')
  item_devolucion_id: string;

  @Column('int')
  producto_id: number;

  @Column('numeric', { precision: 10, scale: 2 })
  precio_reemplazo: number;

  @Column({ length: 50 })
  ajuste_tipo: string;

  @Column({ length: 3 })
  moneda: string;

  @ManyToOne(() => Devolucion, (d) => d.reemplazo)
  @JoinColumn({ name: 'devolucion_id' })
  devolucion: Devolucion;

  @OneToOne(() => ItemDevolucion, (item) => item.reemplazo)
  @JoinColumn({ name: 'item_devolucion_id' })
  itemDevolucion: ItemDevolucion;
}
