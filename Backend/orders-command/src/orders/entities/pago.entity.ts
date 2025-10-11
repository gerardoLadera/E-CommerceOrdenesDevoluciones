import { Entity, PrimaryGeneratedColumn, Column, OneToOne,JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('pago')
export class Pago {
    @PrimaryGeneratedColumn('uuid')
    pago_id: string;

    @Column()
    metodo: string;

    @Column()
    estado: string;

    @Column({ type: 'timestamp' })
    fecha_pago: Date;

    @Column({ type: 'jsonb', nullable: true })
    datosPago: any;

    // @OneToOne(() => Order, order => order.pago)
    // orden: Order;
}