import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Order } from "../entities/order.entity";

@Entity("orden_items")
export class OrderItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('uuid')
    orden_id: string;

    @Column({name: "producto_id"})
    productoId: number;

    @Column()
    cantidad: number;

    @Column(process.env.NODE_ENV === 'test' ? 'real' : 'numeric', { name:"precio_unitario", precision: 10, scale: 2 , nullable:false})
    precioUnitario: number;

    @Column(process.env.NODE_ENV === 'test' ? 'real' : 'numeric', {name:"subTotal", precision: 10, scale: 2, nullable:false})
    subTotal: number;

    @Column({ name:"detalle_producto",type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb', nullable: true })
    detalleProducto: any;

    @ManyToOne(() => Order, orden => orden.items)
    @JoinColumn({ name: "orden_id" })
    orden: Order;
}