import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { OrderItem } from "../entities/orderItem.entity";
import { OrderHistory } from "../entities/orderHistory.entity";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EstadoOrden } from '../enums/estado-orden.enum';

@Entity("ordenes")
export class Order {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único de la orden (UUID)'
  })
  @PrimaryColumn("uuid")
  orden_id: string;

  @ApiProperty({
    example: 'user-123456',
    description: 'ID del cliente'
  })
  @Column({ name: "cliente_id"})
  clienteId: string;

  @ApiProperty({
    example: 99.99,
    description: 'Monto total de la orden',
    minimum: 0
  })
  @Column("numeric", {name:"monto_total", precision: 10, scale: 2 })
  totalOrden: number;

  @ApiProperty({
    example: 'PEN',
    description: 'Moneda de la orden',
    enum: ['USD', 'EUR', 'PEN']
  })
  @Column()
  moneda: string;

  @ApiProperty({ example: 'Tarjeta', description: 'Mètodo de pago elegido en checkout' })
  @Column({name:"metodo_pago", nullable: false})
  metadoPago: string;

  @ApiProperty({
    example: 'CREADO',
    description: 'Estado actual de la orden',
    enum: EstadoOrden,
  })
  @Column({ type: 'enum', enum: EstadoOrden, default: EstadoOrden.CREADO })
  estado: string;

  @ApiProperty({
    description: 'Fecha de creación de la orden'
  })
  @Column({ name: 'fecha_creacion', type: 'timestamp with time zone' })
  fechaCreacion: Date;

  @ApiProperty({
    description: 'Fecha de última actualización de la orden'
  })
  @Column({ name: 'fecha_actualizacion', type: 'timestamp with time zone' ,nullable:true})
  fechaActualizacion: Date;

  @ApiProperty({
    example: 'Av. Siempre Viva 123, Springfield',
    description: 'Dirección de envío'
  })
  @Column({ nullable: false })
  direccion: string;

  @ApiPropertyOptional({
    description: 'ID de la dirección de facturación'
  })
  @Column({ name:"direccion_facturacion",nullable: true })
  direccionFacturacion: string;

  @ApiPropertyOptional({
    description: 'ID del pago asociado'
  })
  @Column({ nullable: true })
  pago_id: string;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales en formato JSON',
    example: { discountApplied: true, loyaltyPoints: 100 }
  })
  @Column({ type: "jsonb", nullable: true })
  metadata: object;

  @ApiPropertyOptional({
    example: 'Notas especiales para la entrega',
    description: 'Información adicional opcional'
  })
  @Column({ name: 'nota_envio', nullable: true })
  notaEnvio?: string;

  @ApiProperty({
    type: () => [OrderItem],
    description: 'Items de la orden'
  })
  @OneToMany(() => OrderItem, ordenItem => ordenItem.orden)
  orden_items: OrderItem[];

  @ApiProperty({
    type: () => [OrderHistory],
    description: 'Historial de cambios de estado'
  })
  @OneToMany(() => OrderHistory, historial => historial.orden)
  orden_historial: OrderHistory[];
}