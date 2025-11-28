import { Entity, PrimaryColumn, Column, OneToMany,OneToOne,JoinColumn } from "typeorm";
import { OrderItem } from "../entities/orderItem.entity";
import { OrderHistory } from "../entities/orderHistory.entity";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EstadoOrden } from '../enums/estado-orden.enum';
import { Pago } from "./pago.entity";

@Entity("ordenes")
export class Order {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único de la orden (UUID)'
  })
  @PrimaryColumn('uuid')
  orden_id: string;


  @ApiProperty({
    example: 'user-123456',
    description: 'ID del cliente'
  })
  @Column({nullable:false})
  usuarioId: number;

  @ApiProperty({
    example: { nombreCompleto: "Juan Pérez",
      telefono:"+51 987654321", 
      direccionLinea1: "Calle Falsa 123",
      direccionLinea2: "Departamento 456",
      ciudad: "Lima",
      provincia: "Lima", 
      codigoPostal: "15001",
      pais: "Perú",
      referencia: "Frente al parque"
    },
      description: 'Dirección de envío'
  })
  @Column({ type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb',nullable: false })
  direccionEnvio: object;

  @ApiPropertyOptional({
    description: 'Costos de la orden en formato JSON',
    example: { subtotal:350.00, impuestos:63.00,envio:0.00, total:413.00}
  })
  @Column({ type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb', nullable: false })
  costos: {
    subtotal: number;
    impuestos: number;
    envio: number;
    total: number;
  };

  @ApiPropertyOptional({
    description: 'Infromacion de la entrega de la orden en formato JSON',
    example: { tipo:'RECOJO_EN_TIENDA', tiendaId:5,direccionEnvioId:12}
  })
  @Column({ type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb', nullable: false })
  entrega: object;

  @ApiProperty({ example: 'Tarjeta', description: 'Mètodo de pago elegido en checkout' })
  @Column({name:"metodo_pago", nullable: false})
  metodoPago: string;

  
//Propios de la entidad
  @ApiProperty({
    example: 'CREADO',
    description: 'Estado actual de la orden',
    enum: EstadoOrden,
  })
  @Column({ type: process.env.NODE_ENV === 'test' ? 'varchar' : 'enum', enum: process.env.NODE_ENV === 'test' ? undefined : EstadoOrden, default: EstadoOrden.CREADO })
  estado: EstadoOrden;

  @ApiProperty({
    description: 'Fecha de creación de la orden'
  })
  @Column({ name: 'fecha_creacion', type:process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz' })
  fechaCreacion: Date;

  @ApiProperty({
    description: 'Fecha de última actualización de la orden'
  })
  @Column({ name: 'fecha_actualizacion', type:process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz' ,nullable:true})
  fechaActualizacion: Date;


  // @Column({ nullable: true })
  // pago_id: string;

  @Column({ name: 'order_number', type: 'int', nullable: false })
  num_orden: number;

  @Column({ name: 'cod_orden', type: 'varchar', length: 30, nullable: false })
  codOrden: string;
  

  // @ApiPropertyOptional({
  //   description: 'ID de la dirección de facturación'
  // })
  // @Column({ name:"direccion_facturacion",nullable: true })
  // direccionFacturacion: string;





  // @ApiPropertyOptional({
  //   example: 'Notas especiales para la entrega',
  //   description: 'Información adicional opcional'
  // })
  // @Column({ name: 'nota_envio', nullable: true })
  // notaEnvio?: string;







// Relaciones con otras entidades  
  @ApiProperty({
    type: () => [OrderItem],
    description: 'Items de la orden'
  })
  @OneToMany(() => OrderItem, ordenItem => ordenItem.orden)
  items: OrderItem[];

  @ApiProperty({
    type: () => [OrderHistory],
    description: 'Historial de cambios de estado'
  })
  @OneToMany(() => OrderHistory, historial => historial.orden)
  orden_historial: OrderHistory[];

  @ApiPropertyOptional({
    description: 'ID del pago asociado'
  })
  @OneToOne(() => Pago,{ nullable: true })
  @JoinColumn({ name: 'pago_id' })
  pago: Pago;

}