import { Injectable } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MongoService } from '../mongo/mongo.service';

@Controller()
@Injectable()
export class KafkaConsumerService {
  constructor(private readonly mongoService: MongoService) {
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

  @EventPattern('order-processed')
  async handleOrderProcessed(@Payload() payload: any) {
    await this.actualizarOrdenProcesada(payload.data);
  }

  @EventPattern('order-delivered')
  async handleOrderDelivered(@Payload() payload: any) {
    await this.actualizarOrdenEntregada(payload.data);
  }

  @EventPattern('return-created')
  async handleReturnCreated(@Payload() payload: any) {
    await this.actualizarOrdenConDevolucion(payload.data);
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
      tiene_devolucion: false,
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

  private async actualizarOrdenProcesada(event: any) {
    console.log(`Evento de orden procesada recibido por Kafka:`, event);

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
      `Orden ${event.orden_id} actualizada como PROCESADA en order-query`,
    );
  }

  private async actualizarOrdenEntregada(event: any) {
    console.log(`Evento de orden entregada recibido por Kafka:`, event);

    const ordenes = this.mongoService.getCollection('ordenes');

    await ordenes.updateOne(
      { _id: event.orden_id },
      {
        $set: {
          estado: event.estadoNuevo,
          fechaActualizacion: new Date(event.fechaActualizacion),
          evidenciasEntrega: event.evidenciasEntrega ?? [],
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
      `Orden ${event.orden_id} actualizada como ENTREGADA en order-query`,
    );
  }

  private async actualizarOrdenConDevolucion(event: any) {
    console.log(`Evento de devolución creada recibido por Kafka:`, event);

    if (!event || !event.orden_id || !event.id) {
      console.error('Evento de devolución con datos insuficientes, ignorando.');
      return;
    }

    const ordenes = this.mongoService.getCollection('ordenes');
    const devoluciones = this.mongoService.getCollection('devoluciones');
    // --- 1. Actualizar la colección 'ordenes' (para los campos tiene_devolucion/id_devolucion) ---
    await ordenes.updateOne(
      { _id: event.orden_id }, // Buscamos por el ID de la orden
      {
        $set: {
          tiene_devolucion: true,
          id_devolucion: event.id, // ID de la devolución
          // Opcional: fechaActualizacion: new Date(event.fechaCreacion)
        },
      },
      { upsert: false },
    );
    console.log(`Orden ${event.orden_id} marcada con info de devolución.`);

    // --- 2. Crear documento en la colección 'devoluciones' (La Proyección de la Devolución) ---
    await devoluciones.findOneAndUpdate(
      { id: event.id }, // FILTRO: Buscar por el ID de la devolución (que es único)
      {
        $set: {
          // Datos a insertar o actualizar
          id: event.id,
          orden_id: event.orden_id,
          codDevolucion: event.codDevolucion,
          estado: event.estado,
          createdAt: new Date(event.createdAt),
          items: event.items ?? [],
          // ... otros campos
        },
      },
      {
        upsert: true, // Si el documento NO existe, lo crea.
        new: true, // Devuelve el documento actualizado.
      },
    );
    console.log(`Proyección de devolución ${event.id} creada en order-query.`);
  }
}
