import { Injectable } from '@nestjs/common';
import type { InstruccionesDevolucion } from '../interfaces/instrucciones-devolucion.interface';
import { Devolucion } from '../entities/devolucion.entity';

@Injectable()
export class InstruccionesDevolucionService {
  /**
   * Genera las instrucciones de devolución cuando una devolución es aprobada
   */
  async generarInstrucciones(
    devolucion: Devolucion,
    metodoDevolucion = 'envio_domicilio',
  ): Promise<InstruccionesDevolucion> {
    // Generar número de autorización único
    const numeroAutorizacion = this.generarNumeroAutorizacion(devolucion.id);

    // Calcular fecha límite (por ejemplo, 15 días desde la aprobación)
    const plazoLimite = new Date();
    plazoLimite.setDate(plazoLimite.getDate() + 15);

    // Construir instrucciones según el método de devolución
    const instrucciones: InstruccionesDevolucion = {
      devolucionId: devolucion.id,
      orderId: devolucion.orderId,
      numeroAutorizacion,
      fechaAprobacion: new Date(),
      instrucciones: {
        pasos: this.obtenerPasos(metodoDevolucion),
        metodoDevolucion,
        plazoLimite,
        direccionEnvio: this.obtenerDireccionDevolucion(metodoDevolucion),
        etiquetaEnvio: this.generarEtiquetaEnvio(devolucion.id),
      },
      items: devolucion.items?.map((item) => ({
        itemId: item.id,
        productoNombre: `Producto ${item.producto_id}`,
        cantidad: item.cantidad,
        razon: item.motivo,
      })) || [],
      informacionAdicional: this.obtenerInformacionAdicional(metodoDevolucion),
    };

    return instrucciones;
  }

  /**
   * Genera un número de autorización único para la devolución
   */
  private generarNumeroAutorizacion(devolucionId: string): string {
    const timestamp = Date.now();
    const shortId = devolucionId.substring(0, 8).toUpperCase();
    return `RMA-${shortId}-${timestamp}`;
  }

  /**
   * Obtiene los pasos específicos según el método de devolución
   */
  private obtenerPasos(metodoDevolucion: string): string[] {
    const pasosComunes = [
      'Verifique que todos los artículos estén en su empaque original',
      'Incluya todos los accesorios y documentación que venían con el producto',
      'No incluya artículos personales en el paquete',
    ];

    switch (metodoDevolucion) {
      case 'envio_domicilio':
        return [
          ...pasosComunes,
          'Descargue e imprima la etiqueta de envío proporcionada',
          'Empaque los artículos de manera segura en una caja resistente',
          'Pegue la etiqueta de envío en el exterior de la caja',
          'Programe una recolección con la compañía de envíos o lleve el paquete a un punto de entrega',
          'Conserve el número de rastreo para su referencia',
        ];
      case 'punto_entrega':
        return [
          ...pasosComunes,
          'Localice el punto de entrega más cercano a su domicilio',
          'Empaque los artículos de manera segura',
          'Lleve el paquete junto con su número de autorización al punto de entrega',
          'Solicite un comprobante de entrega',
        ];
      case 'recoleccion_domicilio':
        return [
          ...pasosComunes,
          'Espere la llamada de confirmación de nuestra empresa de logística',
          'Empaque los artículos de manera segura en una caja resistente',
          'Prepare su número de autorización para mostrarlo al personal de recolección',
          'Entregue el paquete al personal autorizado y solicite un comprobante',
        ];
      default:
        return pasosComunes;
    }
  }

  /**
   * Obtiene la dirección de devolución según el método
   */
  private obtenerDireccionDevolucion(metodoDevolucion: string): {
    calle: string;
    ciudad: string;
    estado: string;
    codigoPostal: string;
    pais: string;
  } | undefined {
    if (metodoDevolucion === 'envio_domicilio') {
      return {
        calle: 'Av. Devoluciones 123, Centro de Distribución',
        ciudad: 'Ciudad de México',
        estado: 'CDMX',
        codigoPostal: '01000',
        pais: 'México',
      };
    }
    return undefined;
  }

  /**
   * Genera un código para la etiqueta de envío
   */
  private generarEtiquetaEnvio(devolucionId: string): string {
    return `LABEL-${devolucionId.substring(0, 12).toUpperCase()}`;
  }

  /**
   * Obtiene información adicional importante
   */
  private obtenerInformacionAdicional(metodoDevolucion: string): string[] {
    return [
      'El proceso de devolución debe completarse dentro del plazo límite especificado',
      'Una vez recibido el producto, se procesará el reembolso o reemplazo en un plazo de 5-7 días hábiles',
      'Recibirá una notificación por correo electrónico cuando su devolución sea procesada',
      'Si tiene alguna pregunta, contacte a nuestro servicio al cliente con su número de autorización',
      'Los productos dañados o usados pueden no ser elegibles para reembolso completo',
    ];
  }
}
