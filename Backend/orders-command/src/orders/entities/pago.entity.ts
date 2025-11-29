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

    @Column({ type:process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp' })
    fecha_pago: Date;

    @Column({ type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb', nullable: true })
    datosPago: any;

    // @OneToOne(() => Order, order => order.pago)
    // orden: Order;
}