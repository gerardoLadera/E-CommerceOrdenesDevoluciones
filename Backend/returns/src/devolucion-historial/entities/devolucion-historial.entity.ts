import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Devolucion } from '../../devolucion/entities/devolucion.entity';
import { EstadoDevolucion } from '../../common/enums/estado-devolucion.enum';

@Entity('devolucion_historial')
export class DevolucionHistorial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  devolucion_id: string;

  @Column({ type: 'enum', enum: EstadoDevolucion })
  estado_anterior: EstadoDevolucion;

  @Column({ type: 'enum', enum: EstadoDevolucion })
  estado_nuevo: EstadoDevolucion;

  @Column({ type:'text', nullable: true })
  comentario: string;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @Column('int')
  modificado_por_id: number;

  @ManyToOne(() => Devolucion, (d) => d.historial)
  @JoinColumn({ name: 'devolucion_id' })
  devolucion: Devolucion;
}
