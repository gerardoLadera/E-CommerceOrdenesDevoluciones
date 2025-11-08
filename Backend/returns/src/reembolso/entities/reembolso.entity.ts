import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Devolucion } from '../../devolucion/entities/devolucion.entity';

@Entity('reembolso')
export class Reembolso {
  @ApiProperty({
    description: 'Identificador único del reembolso',
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
    description: 'Monto total del reembolso',
    example: 599.98,
    type: Number,
  })
  @Column('numeric', { precision: 10, scale: 2 })
  monto: number;

  @ApiProperty({
    description: 'Fecha de procesamiento del reembolso',
    example: '2025-11-07T14:30:00Z',
    type: Date,
  })
  @Column({ type: 'timestamptz' })
  fecha_procesamiento: Date;

  @ApiProperty({
    description: 'Estado actual del reembolso',
    example: 'procesado',
    maxLength: 50,
  })
  @Column({ length: 50 })
  estado: string;

  @ApiProperty({
    description: 'ID de la transacción del sistema de pagos',
    example: 'TXN-20251107-123456-ABC',
    maxLength: 255,
  })
  @Column({ length: 255 })
  transaccion_id: string;

  @ApiProperty({
    description: 'Código ISO de la moneda',
    example: 'USD',
    maxLength: 3,
  })
  @Column({ length: 3 })
  moneda: string;

  @ApiPropertyOptional({
    description: 'Devolución asociada al reembolso',
    type: () => Devolucion,
  })
  @OneToOne(() => Devolucion, (d) => d.reembolso)
  @JoinColumn({ name: 'devolucion_id' })
  devolucion: Devolucion;
}
