import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Order } from "./Order";

@Entity("order_history")
export class OrderHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("uuid")
    order_id: string;

    @Column({ nullable: true })
    previous_status: string;

    @Column()
    new_status: string;

    @Column({ nullable: true })
    changed_by: string;

    @CreateDateColumn({ type: "timestamp with time zone" })
    changed_at: Date;

    @Column({ nullable: true })
    reason: string;

    @ManyToOne(() => Order, order => order.order_history)
    @JoinColumn({ name: "order_id" })
    order: Order;
}