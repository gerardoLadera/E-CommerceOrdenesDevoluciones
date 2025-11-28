// src/reemplazo/entities/reemplazo.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Devolucion } from '../../devolucion/entities/devolucion.entity';
import { ItemDevolucion } from '../../items-devolucion/entities/items-devolucion.entity';

@Entity('reemplazo')
export class Reemplazo {
  @ApiProperty({
    description: 'Identificador único del reemplazo',
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
    description: 'ID del item de devolución que se reemplaza',
    example: '770e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  @Column('uuid')
  item_devolucion_id: string;

  @ApiProperty({
    description: 'ID del producto de reemplazo',
    example: 12345,
    type: Number,
  })
  @Column('int')
  producto_id: number;

  @ApiProperty({
    description: 'Precio del producto de reemplazo',
    example: 349.99,
    type: Number,
  })
  @Column('numeric', { precision: 10, scale: 2 })
  precio_reemplazo: number;

  @ApiProperty({
    description: 'Tipo de ajuste aplicado al reemplazo',
    example: 'sin_cargo',
    maxLength: 50,
  })
  @Column({ length: 50 })
  ajuste_tipo: string;

  @ApiProperty({
    description: 'Código ISO de la moneda',
    example: 'USD',
    maxLength: 3,
  })
  @Column({ length: 3 })
  moneda: string;

  @ApiPropertyOptional({
    description: 'ID de la nueva orden generada producto del reemplazo',
    example: '880e8400-e29b-41d4-a716-446655440003',
    format: 'uuid',
  })
  @Column({ name: 'orden_reemplazo_id', type: 'uuid', nullable: true })
  ordenReemplazoId: string;

  @ApiPropertyOptional({
    description: 'Devolución asociada al reemplazo',
    type: () => Devolucion,
  })
  @ManyToOne(() => Devolucion, (d) => d.reemplazo)
  @JoinColumn({ name: 'devolucion_id' })
  devolucion: Devolucion;

  @ApiPropertyOptional({
    description: 'Item de devolución que se reemplaza',
    type: () => ItemDevolucion,
  })
  @OneToOne(() => ItemDevolucion, (item) => item.reemplazo)
  @JoinColumn({ name: 'item_devolucion_id' })
  itemDevolucion: ItemDevolucion;
}
