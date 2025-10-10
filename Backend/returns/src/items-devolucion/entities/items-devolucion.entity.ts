// src/items-devolucion/entities/item-devolucion.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Devolucion } from '../../devolucion/entities/devolucion.entity';
import { AccionItemDevolucion } from '../../common/enums/accion-item-devolucion.enum';
import { Reemplazo } from '../../reemplazo/entities/reemplazo.entity';

@Entity('items_devolucion')
export class ItemDevolucion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  devolucion_id: string;

  @Column('uuid')
  producto_id: string;

  @Column('int')
  cantidad: number;

  @Column('numeric', { precision: 10, scale: 2 })
  precio_compra: number;

  @Column({ type: 'enum', enum: AccionItemDevolucion })
  tipo_accion: AccionItemDevolucion;

  @Column({ length: 3 })
  moneda: string;

  @Column({ length: 255 })
  motivo: string;

  @ManyToOne(() => Devolucion, (d) => d.items)
  @JoinColumn({ name: 'devolucion_id' })
  devolucion: Devolucion;

  @OneToOne(() => Reemplazo, (r) => r.itemDevolucion)
  reemplazo: Reemplazo;
}
