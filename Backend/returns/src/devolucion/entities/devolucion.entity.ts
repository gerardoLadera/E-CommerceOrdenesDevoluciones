import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoDevolucion } from '../../common/enums/estado-devolucion.enum';
import { DevolucionHistorial } from '../../devolucion-historial/entities/devolucion-historial.entity';
import { ItemDevolucion } from '../../items-devolucion/entities/items-devolucion.entity';
import { Reembolso } from '../../reembolso/entities/reembolso.entity';
import { Reemplazo } from '../../reemplazo/entities/reemplazo.entity';

@Entity('devolucion')
export class Devolucion {
  @ApiProperty({
    description: 'Identificador único de la devolución',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID de la orden asociada a la devolución',
    example: '660e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @Column('uuid', { name: 'order_id', nullable: true })
  orderId: string;

  @Column('varchar', { length: 255, nullable: true })
  reason: string;

  @Column('varchar', { name: 'requested_by', length: 100, nullable: true })
  requestedBy: string;

  @ApiProperty({
    description: 'Fecha de creación de la devolución',
    example: '2025-11-07T10:30:00Z',
    type: Date,
  })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({
    description: 'Estado actual de la devolución',
    enum: EstadoDevolucion,
    example: EstadoDevolucion.PENDIENTE,
    enumName: 'EstadoDevolucion',
  })
  @Column({ type: 'enum', enum: EstadoDevolucion })
  estado: EstadoDevolucion;

  @ApiPropertyOptional({
    description: 'Fecha de procesamiento de la devolución',
    example: '2025-11-08T14:20:00Z',
    type: Date,
    nullable: true,
  })
  @Column({ type: 'timestamptz', nullable: true })
  fecha_procesamiento: Date;

  @ApiPropertyOptional({
    description: 'ID de la orden de reemplazo si aplica',
    example: '770e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
    nullable: true,
  })
  @Column({ type: 'uuid', nullable: true })
  orden_reemplazo_id: string;

  @ApiPropertyOptional({
    description: 'ID del reemplazo asociado',
    example: '880e8400-e29b-41d4-a716-446655440003',
    format: 'uuid',
    nullable: true,
  })
  @Column({ type: 'uuid', nullable: true })
  reemplazo_id: string;

  @ApiPropertyOptional({
    description: 'ID del reembolso asociado',
    example: '990e8400-e29b-41d4-a716-446655440004',
    format: 'uuid',
    nullable: true,
  })
  @Column({ type: 'uuid', nullable: true })
  reembolso_id: string;

  // Relaciones
  @ApiPropertyOptional({
    description: 'Historial de cambios de estado de la devolución',
    type: () => [DevolucionHistorial],
    isArray: true,
  })
  @OneToMany(() => DevolucionHistorial, (historial) => historial.devolucion)
  historial: DevolucionHistorial[];

  @ApiPropertyOptional({
    description: 'Items incluidos en la devolución',
    type: () => [ItemDevolucion],
    isArray: true,
  })
  @OneToMany(() => ItemDevolucion, (item) => item.devolucion, {
    cascade: ['insert'],
    eager: true,
  })
  items: ItemDevolucion[];

  @OneToOne(() => Reembolso, (r) => r.devolucion)
  @JoinColumn({ name: 'reembolso_id' })
  reembolso: Reembolso;

  @ApiPropertyOptional({
    description: 'Información del reemplazo si aplica',
    type: () => Reemplazo,
  })
  @OneToOne(() => Reemplazo, (r) => r.devolucion)
  @JoinColumn({ name: 'reemplazo_id' })
  reemplazo: Reemplazo;
}
