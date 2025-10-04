import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { OrderItem } from "../entities/orderItem.entity";
import { OrderHistory } from "../entities/orderHistory.entity";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EstadoOrden } from '../enums/estado-orden.enum';

@Entity("ordenes")
export class Order {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único de la orden (UUID)'
  })
  @PrimaryColumn("uuid")
  orden_id: string;


  @ApiProperty({
    example: 'user-123456',
    description: 'ID del cliente'
  })
  @Column({ name: "usuario_id"})
  usuarioId: string;

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
  @Column({ nullable: false })
  direccionEnvio: object;

  @ApiPropertyOptional({
    description: 'Costos de la orden en formato JSON',
    example: { subtotal:350.00, impuestos:63.00,envio:0.00, total:413.00}
  })
  @Column({ type: "jsonb", nullable: false })
  costos: object;

  @ApiPropertyOptional({
    description: 'Infromacion de la entrega de la orden en formato JSON',
    example: { tipo:'RECOJO_EN_TIENDA', tiendaId:5,direccionEnvioId:12}
  })
  @Column({ type: "jsonb", nullable: false })
  entrega: object;

  @ApiProperty({ example: 'Tarjeta', description: 'Mètodo de pago elegido en checkout' })
  @Column({name:"metodo_pago", nullable: false})
  metadoPago: string;





  // @ApiProperty({
  //   example: 99.99,
  //   description: 'Monto total de la orden',
  //   minimum: 0
  // })
  // @Column("numeric", {name:"monto_total", precision: 10, scale: 2 })
  // totalOrden: number;

  // @ApiProperty({
  //   example: 'PEN',
  //   description: 'Moneda de la orden',
  //   enum: ['USD', 'EUR', 'PEN']
  // })
  // @Column()
  // moneda: string;

  
//Propios de la entidad
  @ApiProperty({
    example: 'CREADO',
    description: 'Estado actual de la orden',
    enum: EstadoOrden,
  })
  @Column({ type: 'enum', enum: EstadoOrden, default: EstadoOrden.CREADO })
  estado: string;

  @ApiProperty({
    description: 'Fecha de creación de la orden'
  })
  @Column({ name: 'fecha_creacion', type: 'timestamp with time zone' })
  fechaCreacion: Date;

  @ApiProperty({
    description: 'Fecha de última actualización de la orden'
  })
  @Column({ name: 'fecha_actualizacion', type: 'timestamp with time zone' ,nullable:true})
  fechaActualizacion: Date;

  @ApiPropertyOptional({
    description: 'ID del pago asociado'
  })
  @Column({ nullable: true })
  pago_id: string;
  

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
}