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


private async replicarOrden(event: any, tipoEvento: 'CREADA' | 'CANCELADA') {
    console.log(`Evento de orden ${tipoEvento.toLowerCase()} recibido por Kafka:`, event);

    const ordenes = this.mongoService.getCollection('ordenes');
    const historial = event.historialEstados ?? [];

    await ordenes.insertOne({
      _id: event.orden_id,
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

    console.log(`Orden ${event.orden_id} replicada en order-query como ${tipoEvento}`);
  }



  private async actualizarOrdenPagada(event: any) {
  console.log(`Evento de orden pagada recibido por Kafka:`, event);

  const ordenes = this.mongoService.getCollection('ordenes');
  const historial = event.historialEstados ?? [];

  await ordenes.updateOne(
    { _id: event.orden_id },
    {
      $set: {
        estado: event.estado,
        fechaActualizacion: new Date(event.fechaActualizacion),
        pago: {
          pago_id: event.pago.pago_id,
          metodo: event.pago.metodo,
          estado: event.pago.estado,
          fecha_pago: new Date(event.pago.fecha_pago),
          datosPago: event.pago.datosPago,
        },
        historialEstados: historial,
      },
    },
    { upsert: false }
  );

  console.log(`Orden ${event.orden_id} actualizada como PAGADA en order-query`);
}

}
