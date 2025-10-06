import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { OrderHistory } from './entities/orderHistory.entity';
import { KafkaService } from '../kafka/kafka.service'; 
import moment from 'moment-timezone';
import{ EstadoOrden } from './enums/estado-orden.enum';
import { InventoryService } from './inventory/inventory.service';

@Injectable()
export class OrdersService{ 
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(OrderHistory)
    private readonly orderHistoryRepository: Repository<OrderHistory>,

    private readonly kafkaService: KafkaService,
    private readonly inventoryService: InventoryService,
  ) {}


  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const fecha = moment().tz('America/Lima').toDate();


    const lastOrder = await this.orderRepository
    .createQueryBuilder('order')
    .orderBy('order.num_orden', 'DESC')
    .limit(1)
    .getOne();

    const nextOrderNumber = lastOrder ? lastOrder.num_orden + 1 : 1;

    // Generar el código legible de orden
    const fechaStr = moment(fecha).format('YYYYMMDD');
    const codOrden = `ORD-${fechaStr}-${nextOrderNumber.toString().padStart(6, '0')}`;


    // Crear orden
    const order = this.orderRepository.create({
      orden_id: uuidv4(),
      usuarioId: createOrderDto.usuarioId,
      direccionEnvio: createOrderDto.direccionEnvio,
      costos: createOrderDto.costos,
      entrega: createOrderDto.entrega,
      metodoPago: createOrderDto.metodoPago,
      estado: EstadoOrden.CREADO,
      fechaCreacion: fecha,
      fechaActualizacion: fecha,
      num_orden: nextOrderNumber,
      codOrden: codOrden,
    });

    await this.orderRepository.save(order);

    // Crear items
    const items = createOrderDto.items.map((itemDto) =>
      this.orderItemRepository.create({
        orden_id: order.orden_id,
        productoId: itemDto.productoId,
        cantidad: itemDto.cantidad,
        precioUnitario: itemDto.precioUnitario,
        subTotal: itemDto.subTotal,
        detalleProducto: itemDto.detalleProducto,
      }),
    );

    await this.orderItemRepository.save(items);


    // Guardar historial de creación
    const history = this.orderHistoryRepository.create({
        orden_id: order.orden_id,
        estadoAnterior: null,
        estadoNuevo: EstadoOrden.CREADO,
        fechaModificacion: fecha,
        modificadoPor: null,
        motivo: 'Creación de orden desde checkout',
    });

    await this.orderHistoryRepository.save(history);


    //Comunicacion con Inventory para reservar stock /validamos stock
    const reservaResponse = await this.inventoryService.reserveStock(
      items.map(item => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
      }))
    );

    if (reservaResponse.status === 'NO_STOCK') {
      const fechaCancelacion = moment().tz('America/Lima').toDate();

      order.estado = EstadoOrden.CANCELADO;
      order.fechaActualizacion = fechaCancelacion;
      await this.orderRepository.save(order);

      const productos = reservaResponse.productosSinStock ?? [];
      const motivos = productos.map(p => `Producto sin stock: ${p.productoId}`).join(', ');

      const cancelHistory = this.orderHistoryRepository.create({
        orden_id: order.orden_id,
        estadoAnterior: EstadoOrden.CREADO,
        estadoNuevo: EstadoOrden.CANCELADO,
        fechaModificacion: fechaCancelacion,
        modificadoPor: "Sistema",
        motivo: motivos,
      });

      await this.orderHistoryRepository.save(cancelHistory);

    // Emitir evento de orden cancelada
      const cancelPayload = this.buildOrderPayload(order, items, [history, cancelHistory]);

      await this.kafkaService.emitOrderCancelled({
        eventType: 'ORDEN_CANCELADA',
        data: cancelPayload,
        timestamp: new Date().toISOString(),
      });

      return { ...order, items };
    }

    // Emitir evento de orden creada
    const createdPayload = this.buildOrderPayload(order, items, [history]);
    
    await this.kafkaService.emitOrderCreated({
      eventType: 'ORDEN_CREADA',
      data: createdPayload,
      timestamp: new Date().toISOString(),
    });

    return { ...order, items };
  }

  //Plantillla para el payload del evento de  orden cancelada y creada
  private buildOrderPayload(
    order: Order,
    items: OrderItem[],
    history: OrderHistory[]
  ) {
    return {
      orden_id: order.orden_id,
      cod_Orden: order.codOrden,
      clienteId: order.usuarioId,
      estado: order.estado,
      direccionEnvio: order.direccionEnvio,
      costos: order.costos,
      entrega: order.entrega,
      metodoPago: order.metodoPago,
      orden_items: items.map(item => ({
        producto_id: item.productoId,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
        subTotal: item.subTotal,
        detalle_producto: item.detalleProducto,
      })),
      fechaCreacion: order.fechaCreacion,
      fechaActualizacion: order.fechaActualizacion,
      historialEstados: history.map(h => ({
        estadoAnterior: h.estadoAnterior,
        estadoNuevo: h.estadoNuevo,
        fechaModificacion: h.fechaModificacion,
        modificadoPor: h.modificadoPor,
        motivo: h.motivo,
      })),
    };
  }
}
