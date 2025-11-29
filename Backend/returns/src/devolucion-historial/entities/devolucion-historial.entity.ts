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
  @Column('uuid', { name: 'devolucion_id' })
  devolucionId: string;

  @ApiProperty({
    description: 'Estado anterior de la devolución antes del cambio',
    enum: EstadoDevolucion,
    example: EstadoDevolucion.PENDIENTE,
    enumName: 'EstadoDevolucion',
  })
  @ApiProperty({
    description: 'Nuevo estado de la devolución después del cambio',
    enum: EstadoDevolucion,
    example: EstadoDevolucion.PROCESANDO,
    enumName: 'EstadoDevolucion',
  })
  @Column({ type: 'enum', enum: EstadoDevolucion, name: 'estado_nuevo' })
  estadoNuevo: EstadoDevolucion;

  @Column({
    type: 'enum',
    enum: EstadoDevolucion,
    name: 'estado_anterior',
    nullable: true,
  })
  estadoAnterior: EstadoDevolucion | null;

  @ApiPropertyOptional({
    description: 'Comentario opcional sobre el cambio de estado',
    example: 'Devolución aprobada por el administrador',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  comentario: string;

  @ApiProperty({
    description: 'Fecha de creación del registro de historial',
    example: '2025-11-07T14:30:00Z',
    type: Date,
  })
  @CreateDateColumn({ type: 'timestamptz', name: 'fecha_creacion' })
  fechaCreacion: Date;

  @ApiProperty({
    description: 'ID del usuario que realizó la modificación',
    example: '123',
    type: String,
  })
  @Column('varchar', { name: 'modificado_por_id', length: 100 })
  modificadoPorId: string;

  @ApiPropertyOptional({
    description: 'Devolución asociada al registro de historial',
    type: () => Devolucion,
  })
  @ManyToOne(() => Devolucion, (d) => d.historial)
  @JoinColumn({ name: 'devolucion_id' })
  devolucion: Devolucion;
}
