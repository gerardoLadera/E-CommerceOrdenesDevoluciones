import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Order } from "../entities/order.entity";

@Entity("orden_historial")
export class OrderHistory {
    @PrimaryGeneratedColumn()
    historial_id: number;

    @Column('uuid')
    orden_id: string;

    @Column({ name: 'estado_anterior', type: 'varchar', nullable: true })
    estadoAnterior: string | null;

    @Column({ name: 'estado_nuevo', type: 'varchar' })
    estadoNuevo: string;

    @Column({ name: 'modificado_por', type: 'varchar', nullable: true })
    modificadoPor: string | null;

    @Column({ name: 'fecha_modificacion', type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz' })
    fechaModificacion: Date;

    @Column({ name: 'motivo', type: 'varchar', nullable: true })
    motivo: string | null;

    @ManyToOne(() => Order, orden => orden.orden_historial)
    @JoinColumn({ name: "orden_id" })
    orden: Order;
}