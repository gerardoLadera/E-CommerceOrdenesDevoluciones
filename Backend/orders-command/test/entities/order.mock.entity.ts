import { Entity, PrimaryColumn, Column, OneToMany, OneToOne, JoinColumn } from "typeorm";
import { OrderItemMock } from "./orderItem.mock.entity";
import { OrderHistoryMock } from "./orderHistory.mock.entity";
import { EstadoOrden } from "../../src/orders/enums/estado-orden.enum";
import { PagoMock } from "./pago.mock.entity";

@Entity("ordenes_mock")
export class OrderMock {
    @PrimaryColumn("uuid")
    orden_id: string;

    @Column({ nullable: false })
    usuarioId: number;


    @Column({ type: "simple-json", nullable: false })
    direccionEnvio: object;

    @Column({ type: "simple-json", nullable: false })
    costos: {
        subtotal: number;
        impuestos: number;
        envio: number;
        total: number;
    };

    @Column({ type: "simple-json", nullable: false })
    entrega: object;

    @Column({ name: "metodo_pago", nullable: false })
    metodoPago: string;

    @Column({ type: "varchar", default: EstadoOrden.CREADO })
    estado: EstadoOrden;

    @Column({ name: "fecha_creacion", type: "datetime" })
    fechaCreacion: Date;

    @Column({ name: "fecha_actualizacion", type: "datetime", nullable: true })
    fechaActualizacion: Date;

    @Column({ name: "order_number", type: "int", nullable: false })
    num_orden: number;

    @Column({ name: "cod_orden", type: "varchar", length: 30, nullable: false })
    codOrden: string;

    @OneToMany(() => OrderItemMock, ordenItem => ordenItem.orden)
    items: OrderItemMock[];

    @OneToMany(() => OrderHistoryMock, historial => historial.orden)
    orden_historial: OrderHistoryMock[];

    @OneToOne(() => PagoMock, { nullable: true })
    @JoinColumn({ name: "pago_id" })
    pago: PagoMock;
}
