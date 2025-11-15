import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { OrderMock } from "./order.mock.entity";

@Entity("orden_historial_mock")
export class OrderHistoryMock {
    @PrimaryGeneratedColumn()
    historial_id: number;

    @Column("uuid")
    orden_id: string;

    @Column({ name: "estado_anterior", type: "varchar", nullable: true })
    estadoAnterior: string | null;

    @Column({ name: "estado_nuevo", type: "varchar" })
    estadoNuevo: string;

    @Column({ name: "modificado_por", type: "varchar", nullable: true })
    modificadoPor: string | null;

    @Column({ name: "fecha_modificacion", type: "datetime" })
    fechaModificacion: Date;

    @Column({ name: "motivo", type: "varchar", nullable: true })
    motivo: string | null;

    @ManyToOne(() => OrderMock, orden => orden.orden_historial)
    @JoinColumn({ name: "orden_id" })
    orden: OrderMock;
}
