// returns-service/src/devolucion/devolucion.consumer.ts

import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DevolucionMongoService } from './devolucion-mongo/devolucion-mongo.service';

@Controller()
export class DevolucionConsumer {
  // Inyecta el servicio que maneja Mongoose para la colección 'devoluciones'
  constructor(
    private readonly devolucionMongoService: DevolucionMongoService,
  ) {}

  // Escucha el evento que se acaba de emitir
  @EventPattern('return-created')
  async handleReturnCreatedProjection(@Payload() payload: any) {
    console.log(
      `[Returns Projection] Evento 'return-created' recibido para Mongo interno:`,
      payload.data.id,
    );

    const devolucionData = payload.data;

    // ⬅️ CREACIÓN DE LA PROYECCIÓN ÚNICAMENTE A TRAVÉS DE KAFKA
    // Nota: Asume que devolucionData tiene el campo 'id'
    await this.devolucionMongoService.createOrUpdateProjection(devolucionData);

    console.log(
      `[Returns Projection] Documento ${devolucionData.id} creado en Mongo interno.`,
    );
  }
}
