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
  console.log('Mensaje recibido por Kafka:', payload);
  const event = payload.data;

  const ordenes = this.mongoService.getCollection('ordenes'); 

  const historial = event.historialEstados ?? [];


  await ordenes.insertOne({
    _id: event.orden_id,
    cod_orden: event.cod_Orden,
    usuarioId: event.clienteId,
    direccionEnvio: event.direccionEnvio,
    costos: event.costos ?? {},
    entrega: event.entrega ?? {},
    metadoPago: event.metodoPago,
    estado: event.estado,
    fechaCreacion: new Date(event.fechaCreacion),
    fechaActualizacion: new Date(event.fechaCreacion),
    items: event.orden_items ?? [],
    historialEstados: historial, 
  });
  
  console.log(`Orden ${event.orden_id} replicada en order-query`);
}
}
