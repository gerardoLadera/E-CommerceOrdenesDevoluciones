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

  const historial = [{
    estadoAnterior: null,
    estadoNuevo: event.estado,
    fechaModificacion: new Date(event.fechaCreacion),
    modificadoPor: null,
    motivo: null,
  }];

  await ordenes.insertOne({
    _id: event.orden_id,
    clienteId: event.clienteId,
    totalOrden: event.totalOrden,
    moneda: event.moneda,
    metadoPago: event.metodoPago,
    direccion: event.direccion,
    direccionFacturacion: event.direccionFacturacion ?? null,
    metadata: event.metadata ?? null,
    notaEnvio: event.notaEnvio ?? null,
    estado: event.estado,
    fechaCreacion: new Date(event.fechaCreacion),
    fechaActualizacion: new Date(event.fechaCreacion),
    items: event.orden_items ?? [],
    historialEstados: historial, 
  });
  
  console.log(`Orden ${event.id} replicada en order-query`);
}
}
