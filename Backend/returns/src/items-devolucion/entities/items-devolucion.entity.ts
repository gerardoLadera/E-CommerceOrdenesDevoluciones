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
//eliminado en la por nueva BD
// import { Reemplazo } from '../../reemplazo/entities/reemplazo.entity';

@Entity('items_devolucion')
export class ItemDevolucion {
  // Ya no tiene PK
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
    description: 'Tipo de acción solicitada',
    enum: AccionItemDevolucion,
    example: AccionItemDevolucion.REEMBOLSO,
    enumName: 'AccionItemDevolucion',
  })
  @Column({ type: 'enum', enum: AccionItemDevolucion })
  tipo_accion: AccionItemDevolucion;

  //Datos del Producto que se devuelve
  @ApiProperty({
    description: 'ID del producto devuelto',
    example: '70002',
    type: Number,
  })
  @Column('int')
  producto_id_dev: number;

  @ApiProperty({
    description: 'Precio de compra unitario',
    example: 299.99,
    type: Number,
  })
  @Column('numeric', { precision: 10, scale: 2 })
  precio_unitario_dev: number;

  @ApiProperty({
    description: 'Cantidad de unidades a devolver',
    example: 2,
    type: Number,
  })
  @Column('int')
  cantidad_dev: number;

  //Datos del Producto nuevo
  @ApiProperty({
    description: 'ID del producto nuevo',
    example: '70002',
    type: Number,
  })
  @Column({ type: 'int', nullable: true })
  producto_id_new?: number;

  @ApiProperty({
    description: 'Precio de compra unitario',
    example: 299.99,
    type: Number,
    nullable: true,
  })
  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  precio_unitario_new?: number;

  @ApiProperty({
    description: 'Cantidad de unidades a devolver',
    example: 2,
    type: Number,
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  cantidad_new?: number;

  //motivo de reembolzo
  @ApiProperty({
    description: 'Motivo de la devolución',
    example: 'Producto defectuoso',
    maxLength: 255,
    nullable: true,
  })
  @Column({ length: 255 })
  motivo?: string;

  //Relaciones
  @ApiPropertyOptional({
    description: 'Devolución asociada',
    type: () => Devolucion,
  })
  @ManyToOne(() => Devolucion, (d) => d.items)
  @JoinColumn({ name: 'devolucion_id' })
  devolucion: Devolucion;
  /*
  @ApiPropertyOptional({
    description: 'Reemplazo asociado si aplica',
    type: () => Reemplazo,
  })
  @OneToOne(() => Reemplazo, (r) => r.itemDevolucion)
  reemplazo: Reemplazo;
  */
}
