export interface InstruccionesDevolucion {
  devolucionId: string;
  orderId: string;
  numeroAutorizacion: string;
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
    itemId: string;
    productoNombre: string;
    cantidad: number;
    razon: string;
  }[];
  informacionAdicional: string[];
}
