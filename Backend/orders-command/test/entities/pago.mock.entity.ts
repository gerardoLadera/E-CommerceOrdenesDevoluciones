import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("pago_mock")
export class PagoMock {
    @PrimaryGeneratedColumn("uuid")
    pago_id: string;

    @Column()
    metodo: string;

    @Column()
    estado: string;

    @Column({ type: "datetime" })
    fecha_pago: Date;

    @Column({ type: "simple-json", nullable: true })
    datosPago: any;
}