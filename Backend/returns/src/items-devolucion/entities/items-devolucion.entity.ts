// src/items-devolucion/entities/item-devolucion.entity.ts
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
import { AccionItemDevolucion } from '../../common/enums/accion-item-devolucion.enum';
import { Reemplazo } from '../../reemplazo/entities/reemplazo.entity';

@Entity('items_devolucion')
export class ItemDevolucion {
  @ApiProperty({
    description: 'Identificador único del item de devolución',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID de la devolución a la que pertenece',
    example: '660e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @Column('uuid')
  devolucion_id: string;

  @ApiProperty({
    description: 'ID del producto devuelto',
    example: 12345,
    type: Number,
  })
  @Column('int')
  producto_id: number;

  @ApiProperty({
    description: 'Cantidad de unidades a devolver',
    example: 2,
    type: Number,
  })
  @Column('int')
  cantidad: number;

  @ApiProperty({
    description: 'Precio de compra unitario',
    example: 299.99,
    type: Number,
  })
  @Column('numeric', { precision: 10, scale: 2 })
  precio_compra: number;

  @ApiProperty({
    description: 'Tipo de acción solicitada',
    enum: AccionItemDevolucion,
    example: AccionItemDevolucion.REEMBOLSO,
    enumName: 'AccionItemDevolucion',
  })
  @Column({ type: 'enum', enum: AccionItemDevolucion })
  tipo_accion: AccionItemDevolucion;

  @ApiProperty({
    description: 'Código ISO de la moneda',
    example: 'USD',
    maxLength: 3,
  })
  @Column({ length: 3 })
  moneda: string;

  @ApiProperty({
    description: 'Motivo de la devolución',
    example: 'Producto defectuoso',
    maxLength: 255,
  })
  @Column({ length: 255 })
  motivo: string;

  @ApiPropertyOptional({
    description: 'Devolución asociada',
    type: () => Devolucion,
  })
  @ManyToOne(() => Devolucion, (d) => d.items)
  @JoinColumn({ name: 'devolucion_id' })
  devolucion: Devolucion;

  @ApiPropertyOptional({
    description: 'Reemplazo asociado si aplica',
    type: () => Reemplazo,
  })
  @OneToOne(() => Reemplazo, (r) => r.itemDevolucion)
  reemplazo: Reemplazo;
}
