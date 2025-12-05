export interface InstruccionesDevolucion {
  //devolucionId: string;
  id: string;
  //orderId: string;
  orden_id: string;
  //numeroAutorizacion: string;
  orden_reemplazo_id?: string;
  codDevolucion: string;
  fechaAprobacion: Date;
  instrucciones: {
    pasos: string[];
    direccionEnvio?: {
      calle: string;
      ciudad: string;
      estado: string;
      codigoPostal: string;
      pais: string;
    };
    metodoDevolucion: string;
    plazoLimite: Date;
    etiquetaEnvio?: string;
  };
  items: {
    //itemId: string;
    id: string;
    productoNombre: string;
    //producto_id_dev: number;
    precio_unitario_dev: number;
    //cantidad: number;
    cantidad_dev: number;
    //razon: string;
    motivo?: string;
    producto_id_new?: number;
    precio_unitario_new?: number;
    cantidad_new?: number;
  }[];
  informacionAdicional: string[];
}
