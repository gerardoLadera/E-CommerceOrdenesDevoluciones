import { Injectable } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MongoService } from '../mongo/mongo.service';
import { OrdersService } from '../orders/orders.service';

@Controller()
@Injectable()
export class KafkaConsumerService {
  constructor(
    private readonly mongoService: MongoService,
    private readonly ordersService: OrdersService,
  ) {
    console.log('KafkaConsumerService instanciado');
  }

  @EventPattern('order-created')
  async handleOrderCreated(@Payload() payload: any) {
    await this.replicarOrden(payload.data, 'CREADA');
  }

  @EventPattern('order-cancelled')
  async handleOrderCancelled(@Payload() payload: any) {
    await this.replicarOrden(payload.data, 'CANCELADA');
  }

  @EventPattern('order-paid')
  async handleOrderPaid(@Payload() payload: any) {
    await this.actualizarOrdenPagada(payload.data);
  }

  @EventPattern('order-confirmed')
  async handleOrderConfirmed(@Payload() payload: any) {
    await this.actualizarOrdenConfirmada(payload.data);
  }
  // NUEVO MANEJADOR DE EVENTO (ECO-118), para cuando el servicio de Devoluciones envíe un evento de creación
  @EventPattern('return-created')
  async handleReturnCreated(@Payload() payload: any) {
    // El 'payload.data' contiene DevolutionCreatedEventData: { orderId, returnId, ... }
    await this.actualizarOrdenDevolucion(payload.data);
  }

  private async replicarOrden(event: any, tipoEvento: 'CREADA' | 'CANCELADA') {
    console.log(
      `Evento de orden ${tipoEvento.toLowerCase()} recibido por Kafka:`,
      event,
    );

    const ordenes = this.mongoService.getCollection('ordenes');
    const historial = event.historialEstados ?? [];

    await ordenes.insertOne({
      _id: event.orden_id,
      num_orden: event.num_orden,
      cod_orden: event.cod_Orden,
      usuarioId: event.clienteId,
      direccionEnvio: event.direccionEnvio,
      costos: event.costos ?? {},
      entrega: event.entrega ?? {},
      metodoPago: event.metodoPago,
      estado: event.estado,
      fechaCreacion: new Date(event.fechaCreacion),
      fechaActualizacion: new Date(event.fechaActualizacion),
      items: event.orden_items ?? [],
      historialEstados: historial,
    });

    console.log(
      `Orden ${event.orden_id} replicada en order-query como ${tipoEvento}`,
    );
  }

  private async actualizarOrdenPagada(event: any) {
    console.log(`Evento de orden pagada recibido por Kafka:`, event);

    const ordenes = this.mongoService.getCollection('ordenes');

    await ordenes.updateOne(
      { _id: event.orden_id },
      {
        $set: {
          estado: event.estadoNuevo,
          fechaActualizacion: new Date(event.fechaActualizacion),
          pago: {
            pago_id: event.pago.pago_id,
            metodo: event.pago.metodo,
            estado: event.pago.estado,
            fecha_pago: new Date(event.pago.fecha_pago),
            datosPago: event.pago.datosPago,
          },
        },
        $push: {
          historialEstados: {
            estadoAnterior: event.historialNuevo.estadoAnterior,
            estadoNuevo: event.historialNuevo.estadoNuevo,
            fechaModificacion: new Date(event.historialNuevo.fechaModificacion),
            modificadoPor: event.historialNuevo.modificadoPor,
            motivo: event.historialNuevo.motivo,
          },
        },
      },
      { upsert: false },
    );
    console.log(
      `Orden ${event.orden_id} actualizada como PAGADA en order-query`,
    );
  }

  private async actualizarOrdenConfirmada(event: any) {
    console.log(`Evento de orden confirmada recibido por Kafka:`, event);

    const ordenes = this.mongoService.getCollection('ordenes');

    await ordenes.updateOne(
      { _id: event.orden_id },
      {
        $set: {
          estado: event.estadoNuevo,
          fechaActualizacion: new Date(event.fechaActualizacion),
        },
        $push: {
          historialEstados: {
            estadoAnterior: event.historialNuevo.estadoAnterior,
            estadoNuevo: event.historialNuevo.estadoNuevo,
            fechaModificacion: new Date(event.historialNuevo.fechaModificacion),
            modificadoPor: event.historialNuevo.modificadoPor,
            motivo: event.historialNuevo.motivo,
          },
        },
      },
      { upsert: false },
    );

    console.log(
      `Orden ${event.orden_id} actualizada como CONFIRMADA en order-query`,
    );
  }

  // NUEVO MÉTODO  (ECO-118/119) manipula el estado de la orden y crea el documento de devolución
  private async actualizarOrdenDevolucion(event: any) {
    console.log(`Evento de devolución creada recibido por Kafka:`, event);

    const ordenes = this.mongoService.getCollection('ordenes');
    const devoluciones = this.mongoService.getCollection('devoluciones');
    // Usamos 'orderId' y 'returnId' del payload enviado por el servicio de devoluciones
    const orderId = event.orderId;
    const returnId = event.returnId;
    const items = event.returnedItems || event.items || [];

    if (!orderId || !returnId) {
      console.error(
        'Evento de devolución incompleto: falta orderId o returnId',
      );
      return;
    }
    if (items.length === 0) {
      console.error(
        `Evento de devolución incompleto: La devolución ${returnId} no contiene ítems afectados.`,
      );
      // 🛑 IMPORTANTE: No ejecutamos la actualización de la orden (updateOrderFlagForReturnNew)
      // ni la inserción del documento de devolución (devoluciones.insertOne).
      return;
    }

    const result = await this.ordersService.updateOrderFlagForReturnNew(
      orderId,
      returnId,
    );

    if (result.modifiedCount > 0) {
      console.log(
        `Orden ${orderId} actualizada con ${result.modifiedCount} documento(s) modificado(s).`,
      );
    } else {
      // El test falla si esta línea no se ejecuta.
      console.error(
        `ERROR: La orden ${orderId} NO fue actualizada. No se encontró el documento o no hubo cambios.`,
      );
    }

    try {
      const items = event.returnedItems || event.items || [];
      const devolucionDocumento = {
        _id: event.returnId,
        orden_id: event.orderId,
        tipo: items.length > 0 ? items[0].action.toUpperCase() : null,

        estado: event.status,
        fecha_solicitud: new Date(event.createdAt),
        motivo: event.reason || null,

        items_afectados: items,
        fecha_resolucion: null,
        producto_reemplazo: null,
        saldo_ajuste: null,
        monto_reembolsado: 0,
        gestionado_por: event.requestedBy || null,
        reembolso_id: null,
      };
      // NSERCIÓN: Usamos la nueva colección 'devoluciones'
      await devoluciones.insertOne(devolucionDocumento);

      console.log(
        `Documento de Devolución ${returnId} creado en la colección 'devoluciones'.`,
      );
    } catch (error) {
      console.error(`ERROR al replicar la devolución ${returnId}:`, error);
    }
  }
}
