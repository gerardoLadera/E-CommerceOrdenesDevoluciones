import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Order } from "../entities/order.entity";

@Entity("order_history")
export class OrderHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("uuid")
    order_id: string;

    @Column({ type: 'varchar', nullable: true })
    previous_status: string | null;

    @Column({ type: 'varchar' })
    new_status: string;

    @Column({ type: 'varchar', nullable: true })
    changed_by: string | null;

    @CreateDateColumn({ type: "timestamp with time zone" })
    changed_at: Date;

    @Column({ type: 'varchar', nullable: true })
    reason: string | null;

    @ManyToOne(() => Order, order => order.order_history)
    @JoinColumn({ name: "order_id" })
    order: Order;
}