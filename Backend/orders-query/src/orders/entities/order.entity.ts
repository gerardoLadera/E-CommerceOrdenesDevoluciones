import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { OrderItem } from "../entities/orderItem.entity";
import { OrderHistory } from "../entities/orderHistory.entity";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

@Entity("orders")
export class Order {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único de la orden (UUID)'
  })
  @PrimaryColumn("uuid")
  id: string;

  @ApiProperty({
    example: 'user-123456',
    description: 'ID del cliente'
  })
  @Column()
  user_id: string;

  @ApiProperty({
    example: 99.99,
    description: 'Monto total de la orden',
    minimum: 0
  })
  @Column("numeric", { precision: 10, scale: 2 })
  total_amount: number;

  @ApiProperty({
    example: 'USD',
    description: 'Moneda de la orden',
    enum: ['USD', 'EUR', 'PEN']
  })
  @Column()
  currency: string;

  @ApiProperty({
    example: 'CREATED',
    description: 'Estado actual de la orden',
    enum: ['CREATED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
  })
  @Column()
  status: string;

  @ApiProperty({
    description: 'Fecha de creación de la orden'
  })
  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at: Date;

  @ApiProperty({
    description: 'Fecha de última actualización'
  })
  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at: Date;

  @ApiProperty({
    example: 'Av. Siempre Viva 123, Springfield',
    description: 'Dirección de envío'
  })
  @Column({ nullable: true })
  shipping_address: string;

  @ApiPropertyOptional({
    description: 'ID de la dirección de facturación'
  })
  @Column({ nullable: true })
  billing_address_id: string;

  @ApiPropertyOptional({
    description: 'ID del pago asociado'
  })
  @Column({ nullable: true })
  payment_id: string;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales en formato JSON',
    example: { discountApplied: true, loyaltyPoints: 100 }
  })
  @Column({ type: "jsonb", nullable: true })
  metadata: object;

  @ApiProperty({
    type: () => [OrderItem],
    description: 'Items de la orden'
  })
  @OneToMany(() => OrderItem, orderItem => orderItem.order)
  order_items: OrderItem[];

  @ApiProperty({
    type: () => [OrderHistory],
    description: 'Historial de cambios de estado'
  })
  @OneToMany(() => OrderHistory, orderHistory => orderHistory.order)
  order_history: OrderHistory[];
}