import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { OrderMock } from "./order.mock.entity";

@Entity("order_item_mock")
export class OrderItemMock {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("uuid")
    orden_id: string;

    @Column({ name: "producto_id" })
    productoId: number;

    @Column()
    cantidad: number;

    @Column("numeric", { name:"precio_unitario", precision: 10, scale: 2, nullable:false })
    precioUnitario: number;

    @Column("numeric", { name:"subTotal", precision: 10, scale: 2, nullable:false })
    subTotal: number;


    @Column({ name:"detalle_producto", type: "simple-json", nullable: true })
    detalleProducto: any;

    @ManyToOne(() => OrderMock, orden => orden.items)
    @JoinColumn({ name: "orden_id" })
    orden: OrderMock;
}