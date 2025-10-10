import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoDevolucion } from '../../common/enums/estado-devolucion.enum';
import { DevolucionHistorial } from '../../devolucion-historial/entities/devolucion-historial.entity';
import { ItemDevolucion } from '../../items-devolucion/entities/items-devolucion.entity';
import { Reembolso } from '../../reembolso/entities/reembolso.entity';
import { Reemplazo } from '../../reemplazo/entities/reemplazo.entity';

@Entity('devolucion')
export class Devolucion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  orderId: number;
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'enum', enum: EstadoDevolucion })
  estado: EstadoDevolucion;

  @Column({ type: 'timestamptz', nullable: true })
  fecha_procesamiento: Date;

  @Column({ type: 'uuid', nullable: true })
  orden_reemplazo_id: string;

  @Column({ type: 'uuid', nullable: true })
  reemplazo_id: string;

  @Column({ type: 'uuid', nullable: true })
  reembolso_id: string;

  // Relaciones
  @OneToMany(() => DevolucionHistorial, (hist) => hist.devolucion)
  historial: DevolucionHistorial[];

  @OneToMany(() => ItemDevolucion, (item) => item.devolucion)
  items: ItemDevolucion[];

  @OneToOne(() => Reembolso, (r) => r.devolucion)
  @JoinColumn()
  reembolso: Reembolso;

  @OneToOne(() => Reemplazo, (r) => r.devolucion)
  @JoinColumn()
  reemplazo: Reemplazo;
}
