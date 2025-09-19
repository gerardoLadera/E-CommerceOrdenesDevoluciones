import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Order } from "../entities/order.entity";

@Entity("order_items")
export class OrderItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("uuid")
    order_id: string;

    @Column()
    sku_id: string;

    @Column()
    quantity: number;

    @Column("numeric", { precision: 10, scale: 2 })
    unit_price: number;

    @Column("numeric", { precision: 10, scale: 2 })
    total_price: number;

    @Column({ type: "jsonb", nullable: true })
    attributes: object;

    @ManyToOne(() => Order, order => order.order_items)
    @JoinColumn({ name: "order_id" })
    order: Order;
}