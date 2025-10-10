import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Devolucion } from '../../devolucion/entities/devolucion.entity';

@Entity('reembolso')
export class Reembolso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  devolucion_id: string;

  @Column('numeric', { precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'timestamptz' })
  fecha_procesamiento: Date;

  @Column({ length: 50 })
  estado: string;

  @Column({ length: 255 })
  transaccion_id: string;

  @Column({ length: 3 })
  moneda: string;

  @OneToOne(() => Devolucion, (d) => d.reembolso)
  @JoinColumn({ name: 'devolucion_id' })
  devolucion: Devolucion;
}
