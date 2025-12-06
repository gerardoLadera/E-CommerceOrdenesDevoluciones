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
import { InventoryService ,ReservaPayload } from './inventory/inventory.service';
import { CatalogService, DetalleProducto } from './catalog/catalog.service';
import {PaymentsClient } from './payments/payments.service';
import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

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
    private readonly catalogService: CatalogService
  ) {}


async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
  const fecha = moment().tz('America/Lima').toDate();

  const lastOrder = await this.orderRepository
    .createQueryBuilder('order')
    .orderBy('order.num_orden', 'DESC')
    .limit(1)
    .getOne();

  const nextOrderNumber = lastOrder ? lastOrder.num_orden + 1 : 1;

  const fechaStr = moment(fecha).format('YYYYMMDD');
  const codOrden = `ORD-${fechaStr}-${nextOrderNumber.toString().padStart(6, '0')}`;

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
    codOrden,
  });
  await this.orderRepository.save(order);

  // Items sin detalles aún
  const items = createOrderDto.items.map((itemDto) =>
    this.orderItemRepository.create({
      orden_id:  order.orden_id,
      productoId: itemDto.productoId,
      cantidad: itemDto.cantidad,
      precioUnitario: itemDto.precioUnitario,
      subTotal: itemDto.subTotal,
      detalleProducto: null,
    }),
  );
  await this.orderItemRepository.save(items);

  const history = this.orderHistoryRepository.create({
    orden_id: order.orden_id,
    estadoAnterior: createOrderDto.estadoInicial,
    estadoNuevo: EstadoOrden.CREADO,
    fechaModificacion: fecha,
    modificadoPor: 'Sistema',
    motivo: 'Creación de orden desde checkout',
  });
  await this.orderHistoryRepository.save(history);

  
  const responseOrder = { ...order, items };

  
  (async () => {
    // Catálogo
    let detalles: Record<number, DetalleProducto> = {};
    try {
      const productoIds = createOrderDto.items.map(i => i.productoId);
      detalles = await this.catalogService.obtenerDetalles(productoIds);
    } catch (error) {
      console.error('Error al obtener detalles del catálogo:', error.message);
      detalles = {};
    }

    for (const item of items) {
      item.detalleProducto = detalles[item.productoId] || null;
    }
    await this.orderItemRepository.save(items);

    // Inventario
    const reservaPayload: ReservaPayload = {
      id_orden: order.num_orden,
      productos: items.map(item => ({
        id_producto: item.productoId,
        cantidad: item.cantidad,
      })),
      tipo_envio: createOrderDto.entrega.tipo as 'RECOJO_TIENDA' | 'DOMICILIO',
    };

    if (createOrderDto.entrega.tipo === 'RECOJO_TIENDA') {
      reservaPayload.id_tienda = createOrderDto.entrega.tiendaSeleccionada?.id;
    }
    if (createOrderDto.entrega.tipo === 'DOMICILIO') {
      reservaPayload.id_carrier = createOrderDto.entrega.carrierSeleccionado?.carrier_id;
      reservaPayload.direccion_envio = createOrderDto.direccionEnvio.direccionLinea1;
      reservaPayload.latitud_destino = createOrderDto.entrega.almacenOrigen.latitud;
      reservaPayload.longitud_destino = createOrderDto.entrega.almacenOrigen.longitud;
    }

    try {
      const reservaResponse = await this.inventoryService.reserveStock(reservaPayload);
      console.log("Respuesta del servicio de inventario:", reservaResponse);

      const createdPayload = this.buildOrderPayload(order, items, [history]);
      await this.kafkaService.emitOrderCreated({
        eventType: 'ORDEN_CREADA',
        data: createdPayload,
        timestamp: new Date().toISOString(),
      });

      await this.procesarPago(order.orden_id);

    } catch (error) {
      const fechaCancelacion = moment().tz('America/Lima').toDate();

      order.estado = EstadoOrden.CANCELADO;
      order.fechaActualizacion = fechaCancelacion;
      await this.orderRepository.save(order);

      const cancelHistory = this.orderHistoryRepository.create({
        orden_id: order.orden_id,
        estadoAnterior: EstadoOrden.CREADO,
        estadoNuevo: EstadoOrden.CANCELADO,
        fechaModificacion: fechaCancelacion,
        modificadoPor: "Sistema",
        motivo: error.message,
      });
      await this.orderHistoryRepository.save(cancelHistory);

      const cancelPayload = this.buildOrderPayload(order, items, [history, cancelHistory]);
      await this.kafkaService.emitOrderCancelled({
        eventType: 'ORDEN_CANCELADA',
        data: cancelPayload,
        timestamp: new Date().toISOString(),
      });
    }
  })();

  return responseOrder;
}



async procesarPago(orderId: string): Promise<void> {
  const order = await this.orderRepository.findOne({
    where: { orden_id: orderId },
    relations: ['items'],
  });

  if (!order || order.estado !== EstadoOrden.CREADO) {
    throw new Error('Orden no válida para procesar pago');
  }

  let pagoSimulado;
  try {
    pagoSimulado = await this.paymentsClient.procesarPago({
      orden_id: order.orden_id,
      cliente_id: order.usuarioId,
      monto: order.costos.total,
      metodoPago: order.metodoPago,
    });
  } catch (error) {
    console.error('Error al comunicar con el servicio de pagos:', error.message);
    throw new ServiceUnavailableException('No se pudo comunicar con el módulo de Pagos');
  }

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
    await this.orderRepository.save({ ...orden });

    const history = this.orderHistoryRepository.create({
      orden_id: orden.orden_id,
      estadoAnterior,
      estadoNuevo,
      fechaModificacion: fecha,
      modificadoPor: usuario,
      motivo,
    });

    await this.orderHistoryRepository.save(history);
      
    
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

    //Realizar descuento de items en inventario
    await this.procesarInventario(orden);
  
}


async procesarInventario(orden: Order): Promise<void> {
  if (orden.estado !== EstadoOrden.CONFIRMADO) {
    throw new BadRequestException(
      `La orden debe estar en estado CONFIRMADO para descontar stock`
    );
  }

  // const itemsPayload = orden.items.map(item => ({
  //   productoId: item.productoId,
  //   cantidad: item.cantidad,
  // }));

  // let respuestaInventario;
  try {
    const respuestaInventario = await this.inventoryService.descontarStock({
      ordenId: orden.num_orden,
      clienteId: orden.usuarioId,
    });

    console.log('Respuesta del servicio de inventario:', respuestaInventario);

    await this.actualizarOrdenProcesada(orden);

  } catch (error) {
    console.error('Error al comunicar con Inventario:', error.message);

    throw new ServiceUnavailableException(
      'No se pudo comunicar con el módulo de Inventario'
    );  
  }

  // if (respuestaInventario.status === 'STOCK_DESCONTADO') {
  //   await this.actualizarOrdenProcesada(orden);
  // } else {
  //   throw new BadRequestException(
  //     'Inventario no confirmó el descuento de stock, la orden no puede pasar a PROCESADO'
  //   );
  // }
}



async actualizarOrdenProcesada(orden: Order): Promise<void> { 
  const fecha = moment().tz('America/Lima').toDate();
  const estadoAnterior = orden.estado;
  const estadoNuevo = EstadoOrden.PROCESADO;
  const motivo = 'Inventario confirmó descuento exitoso de stock reservado';

  orden.estado = estadoNuevo;
  orden.fechaActualizacion = fecha;
  await this.orderRepository.save({ ...orden });

  const history = this.orderHistoryRepository.create({
    orden_id: orden.orden_id,
    estadoAnterior,
    estadoNuevo,
    fechaModificacion: fecha,
    modificadoPor: 'Sistema', 
    motivo,
  });
  await this.orderHistoryRepository.save(history);

  const processedPayload = {
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

  await this.kafkaService.emitOrderProcessed({
    eventType: 'ORDEN_PROCESADA',
    data: processedPayload,
    timestamp: new Date().toISOString(),
  });

}


async confirmarEntrega(
  numOrden: number,
  contexto: { mensaje?: string; evidencias?: { tipo: string; valor: string }[] }
): Promise<void> {
  const orden = await this.orderRepository.findOne({
    where: { num_orden: numOrden },
    relations: ['items'],
  });

  if (!orden) {
    throw new NotFoundException(`Orden no encontrada: ${numOrden}`);
  }

  if (orden.estado === EstadoOrden.ENTREGADO) {
    throw new BadRequestException(`La orden ${numOrden} ya está ENTREGADA`);
  }

  if (orden.estado !== EstadoOrden.PROCESADO) {
    throw new BadRequestException(
      `La orden debe estar en estado PROCESADO para marcarla como ENTREGADA`
    );
  }

  const fecha = moment().tz('America/Lima').toDate();
  const estadoAnterior = orden.estado;
  const estadoNuevo = EstadoOrden.ENTREGADO;
  const motivoBase = 'Modulo de envíos confirmó la entrega final al cliente';
  const motivo = contexto?.mensaje ? `${motivoBase} - ${contexto.mensaje}` : motivoBase;

  orden.estado = estadoNuevo;
  orden.fechaActualizacion = fecha;
  await this.orderRepository.save(orden);

  const history = this.orderHistoryRepository.create({
    orden_id: orden.orden_id,
    estadoAnterior,
    estadoNuevo,
    fechaModificacion: fecha,
    modificadoPor: 'Servicio de envíos',
    motivo,
  });
  await this.orderHistoryRepository.save(history);

  const deliveredPayload = {
    orden_id: orden.orden_id,
    num_orden: orden.num_orden,
    estadoNuevo: orden.estado,
    fechaActualizacion: fecha.toISOString(),
    historialNuevo: {
      estadoAnterior: history.estadoAnterior,
      estadoNuevo: history.estadoNuevo,
      fechaModificacion: history.fechaModificacion.toISOString(),
      modificadoPor: history.modificadoPor,
      motivo: history.motivo,
    },
    evidenciasEntrega: contexto?.evidencias ?? [],
  };

  await this.kafkaService.emitOrderDelivered({
    eventType: 'ORDEN_ENTREGADA',
    data: deliveredPayload,
    timestamp: new Date().toISOString(),
  });

  console.log(`Orden ${orden.num_orden} actualizada a ENTREGADO`);
}








  //Plantillla para el payload del evento de  orden cancelada y creada
  private buildOrderPayload(
    order: Order,
    items: OrderItem[],
    history: OrderHistory[]
  ) {
    return {
      orden_id: order.orden_id,
      num_orden: order.num_orden,
      cod_Orden: order.codOrden,
      clienteId: order.usuarioId,
      estado: order.estado,
      direccionEnvio: order.direccionEnvio,
      costos: order.costos,
      entrega: order.entrega,
      metodoPago: order.metodoPago,
      orden_items: items.map(item => ({
        id: item.id,
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
