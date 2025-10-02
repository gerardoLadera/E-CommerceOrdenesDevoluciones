import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Order } from "../entities/order.entity";

@Entity("orden_items")
export class OrderItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("uuid")
    orden_id: string;

    @Column({name: "producto_id"})
    productoId: string;

    @Column()
    cantidad: number;

    @Column("numeric", { name:"precio_unitario", precision: 10, scale: 2 , nullable:false})
    precioUnitario: number;

    @Column("numeric", {name:"precio_total", precision: 10, scale: 2, nullable:false})
    precioTotal: number;

    @Column({ name:"detalle_producto",type: "jsonb", nullable: true })
    detalleProducto:  {
    nombre: string;
    descripcion: string;
    marca:string;
    modelo: string;
    precio: number;
    imagen: string;
};

    @ManyToOne(() => Order, orden => orden.orden_items)
    @JoinColumn({ name: "orden_id" })
    orden: Order;
}