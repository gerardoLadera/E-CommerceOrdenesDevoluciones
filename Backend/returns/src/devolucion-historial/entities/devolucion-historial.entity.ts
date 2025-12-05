import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Devolucion } from '../../devolucion/entities/devolucion.entity';
import { EstadoDevolucion } from '../../common/enums/estado-devolucion.enum';

@Entity('devolucion_historial')
export class DevolucionHistorial {
  @ApiProperty({
    description: 'Identificador único del registro de historial',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID de la devolución asociada',
    example: '660e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @Column('uuid')
  devolucion_id: string;

  @ApiProperty({
    description: 'Estado anterior de la devolución antes del cambio',
    enum: EstadoDevolucion,
    example: EstadoDevolucion.PENDIENTE,
    enumName: 'EstadoDevolucion',
  })
  @Column({ type: 'enum', enum: EstadoDevolucion })
  estado_anterior: EstadoDevolucion;

  @ApiProperty({
    description: 'Nuevo estado de la devolución después del cambio',
    enum: EstadoDevolucion,
    example: EstadoDevolucion.PROCESANDO,
    enumName: 'EstadoDevolucion',
  })
  @Column({ type: 'enum', enum: EstadoDevolucion })
  estado_nuevo: EstadoDevolucion;
  /*
    @ApiPropertyOptional({
      description: 'Comentario opcional sobre el cambio de estado',
      example: 'Devolución aprobada por el administrador',
      nullable: true,
    })
    @Column({ type:'text', nullable: true })
    comentario: string;
  */
  @ApiProperty({
    description: 'Fecha de creación del registro de historial',
    example: '2025-11-07T14:30:00Z',
    type: Date,
  })
  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @ApiProperty({
    description: 'ID del usuario que realizó la modificación',
    example: 1,
    type: Number,
  })
  @Column('int')
  modificado_por_id: number;

  @ApiPropertyOptional({
    description: 'Devolución asociada al registro de historial',
    type: () => Devolucion,
  })
  @ManyToOne(() => Devolucion, (d) => d.historial)
  @JoinColumn({ name: 'devolucion_id' })
  devolucion: Devolucion;
}
