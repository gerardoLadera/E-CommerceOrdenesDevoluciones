import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { OrderHistory } from './entities/orderHistory.entity';
import { Pago } from './entities/pago.entity';
import { KafkaService } from '../kafka/kafka.service'; 
import moment from 'moment-timezone';
import{ EstadoOrden } from './enums/estado-orden.enum';
import { InventoryService } from './inventory/inventory.service';
import {PaymentsClient } from './payments/payments.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Injectable()
export class OrdersService{ 
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(OrderHistory)
    private readonly orderHistoryRepository: Repository<OrderHistory>,

    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,

    private readonly kafkaService: KafkaService,
    private readonly inventoryService: InventoryService,
    private readonly paymentsClient: PaymentsClient,
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
      order.orden_id,
      items.map(item => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
      }))
    );

    console.log("Respuesta del servicio de inventario:", reservaResponse);

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

    await this.procesarPago(order.orden_id);
    
    return { ...order, items };

  }


async procesarPago(orderId: string): Promise<void> {
  const order = await this.orderRepository.findOne({
    where: { orden_id: orderId },
    relations: ['items'],
  });

  if (!order || order.estado !== EstadoOrden.CREADO) {
    throw new Error('Orden no válida para procesar pago');
  }

  const pagoSimulado = await this.paymentsClient.procesarPago({
      orden_id: order.orden_id,
      cliente_id: order.usuarioId,
      monto: order.costos.total,
      metodoPago: order.metodoPago,
    });

    // Crear entidad de pago
    const pago = this.pagoRepository.create({
      pago_id: pagoSimulado.pago_id,
      metodo: pagoSimulado.metodoPago,
      estado: pagoSimulado.status,
      fecha_pago: new Date(pagoSimulado.fecha_pago),
      datosPago: pagoSimulado.datosPago,
    });

    await this.pagoRepository.save(pago);

    if (pago.estado === 'PAGO_EXITOSO') {
      const fechaPago = moment().tz('America/Lima').toDate();

      order.pago = pago;
      order.estado = EstadoOrden.PAGADO;
      order.fechaActualizacion = fechaPago; 
      await this.orderRepository.save(order);


      const historyPago = this.orderHistoryRepository.create({
      orden_id: order.orden_id,
      estadoAnterior: EstadoOrden.CREADO,
      estadoNuevo: EstadoOrden.PAGADO,
      fechaModificacion: fechaPago,
      modificadoPor: 'Sistema',
      motivo: 'Pago exitoso confirmado',
    });

    await this.orderHistoryRepository.save(historyPago);

    // const history = await this.orderHistoryRepository.findOne({
    //   where: {
    //     orden_id: order.orden_id,
    //     estadoNuevo: EstadoOrden.CREADO,
    //   },
    //   order: { fechaModificacion: 'ASC' },
    // }) as OrderHistory;;

    // const items = order.items;

    // Emitir evento de orden pagada
    // const pagadaPayload = {
    //   ...this.buildOrderPayload(order, items, [history, historyPago]),
    //   pago: {
    //     pago_id: pago.pago_id,
    //     metodo: pago.metodo,
    //     estado: pago.estado,
    //     fecha_pago: pago.fecha_pago,
    //     datosPago: pago.datosPago,
    //   },
    // };

    const pagadaPayload = {
      orden_id: order.orden_id,
      estadoNuevo: order.estado,
      fechaActualizacion: fechaPago.toISOString(),
      historialNuevo: {
        estadoAnterior: historyPago.estadoAnterior,
        estadoNuevo: historyPago.estadoNuevo,
        fechaModificacion: historyPago.fechaModificacion.toISOString(),
        modificadoPor: historyPago.modificadoPor,
        motivo: historyPago.motivo,
      },
      pago: {
        pago_id: pago.pago_id,
        metodo: pago.metodo,
        estado: pago.estado,
        fecha_pago: pago.fecha_pago,
        datosPago: pago.datosPago,
      },
    };


    await this.kafkaService.emitOrderPaid({
      eventType: 'ORDEN_PAGADA',
      data: pagadaPayload,
      timestamp: new Date().toISOString(),
    });

  }

}


// Actualizar estado de la orden a CONFIRMADO
async confirmarOrden(ordenId: string, usuario: string): Promise<void> {
  const orden = await this.orderRepository.findOne({ where: { orden_id: ordenId },relations: ['items'], });
    if (!orden) {
        throw new NotFoundException(`Orden no encontrada: ${ordenId}`);
      }

      if (orden.estado !== EstadoOrden.PAGADO) {
        throw new BadRequestException(`La orden seleccionada no presenta pago registrado o ya ha sido confirmada`);
      }

    const fecha = moment().tz('America/Lima').toDate();
    const estadoAnterior = orden.estado;
    const estadoNuevo = EstadoOrden.CONFIRMADO;
    const motivo = 'Orden con pago procesado correctamente';

    orden.estado = estadoNuevo;
    orden.fechaActualizacion = fecha;
    await this.orderRepository.save(orden);

    const history = this.orderHistoryRepository.create({
      orden_id: orden.orden_id,
      estadoAnterior,
      estadoNuevo,
      fechaModificacion: fecha,
      modificadoPor: usuario,
      motivo,
    });

    await this.orderHistoryRepository.save(history);
      
    const itemsPayload = orden.items.map(item => ({
      productoId: item.productoId,
      cantidad: item.cantidad,
    }));

    // Llamar al servicio de inventario
    const respuestaInventario = await this.inventoryService.descontarStock({
      ordenId: ordenId,
      items: itemsPayload,
    });

console.log('Respuesta del servicio de inventario:', respuestaInventario);

    
    const confirmedpayload = {
      orden_id: orden.orden_id,
      estadoNuevo: orden.estado,
      fechaActualizacion: fecha.toISOString(),
      historialNuevo: {
        estadoAnterior: history.estadoAnterior,
        estadoNuevo: history.estadoNuevo,
        fechaModificacion: history.fechaModificacion.toISOString(),
        modificadoPor: history.modificadoPor,
        motivo: history.motivo,
      },
    };

  // Emitir evento de orden confirmada
    await this.kafkaService.emitOrderStatusUpdated({
      eventType: 'ORDEN_CONFIRMADA',
      data:confirmedpayload,
      timestamp: new Date().toISOString(),
    });
  
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
        precioUnitario: item.precioUnitario,
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
