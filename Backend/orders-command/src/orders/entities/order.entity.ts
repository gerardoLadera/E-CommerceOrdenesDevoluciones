import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { OrderItem } from "../entities/orderItem.entity"; // Importar OrderItem
import { OrderHistory } from "../entities/orderHistory.entity"; // IMPORTAR OrderHistory
import { ApiProperty } from "@nestjs/swagger";

@Entity("orders")
export class Order {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    @PrimaryColumn("uuid")
    id: string;

    @ApiProperty({ example: 'user-123' })
    @Column()
    user_id: string;

    @ApiProperty({ example: 99.99 })
    @Column("numeric", { precision: 10, scale: 2 })
    total_amount: number;

    @ApiProperty({ example: 'USD' })
    @Column()
    currency: string;

    @ApiProperty({ example: 'CREATED' })
    @Column()
    status: string;

    @ApiProperty()
    @CreateDateColumn({ type: "timestamp with time zone" })
    created_at: Date;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    updated_at: Date;

    @Column({ nullable: true })
    shipping_address: string;

    @Column({ nullable: true })
    billing_address_id: string;

    @Column({ nullable: true })
    payment_id: string;

    @Column({ type: "jsonb", nullable: true })
    metadata: object;

    // Relación de uno a muchos con OrderItem
    @OneToMany(() => OrderItem, orderItem => orderItem.order)
    order_items: OrderItem[];

    // RELACIÓN DE UNO A MUCHOS CON OrderHistory
    @OneToMany(() => OrderHistory, orderHistory => orderHistory.order)
    order_history: OrderHistory[];
}