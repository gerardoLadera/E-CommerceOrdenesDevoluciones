import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { OrderItem } from "./OrderItem"; // Importar OrderItem
import { OrderHistory } from "./OrderHistory"; // IMPORTAR OrderHistory

@Entity("orders")
export class Order {
    @PrimaryColumn("uuid")
    id: string;

    @Column()
    user_id: string;

    @Column("numeric", { precision: 10, scale: 2 })
    total_amount: number;

    @Column()
    currency: string;

    @Column()
    status: string;

    @CreateDateColumn({ type: "timestamp with time zone" })
    created_at: Date;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    updated_at: Date;

    @Column({ nullable: true })
    shipping_address_id: string;

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