// Define y exporta el tipo de estado para que sea reusable
export type EstadoDevolucion =
  | "SOLICITADO"
  | "APROBADO"
  | "RECHAZADO"
  | "PROCESANDO"
  | "COMPLETADA"
  | "ERROR_REEMBOLSO"
  | "pendiente";

export interface ArticuloDevuelto {
  id: string;
  tipo_accion: string;
  producto_id_dev: string | number;
  precio_unitario_dev: number | string;
  cantidad_dev: number;
  motivo: string;
  producto_id_new: string | number | null;
  precio_unitario_new: number | string | null;
  cantidad_new: number | null;
}

export interface DetalleDevolucion {
  id: string;
  codDevolucion?: string;
  orderId: string;
  codOrden?: string;
  estado: EstadoDevolucion;
  historial: {
    fecha_creacion: string;
    estado_anterior: string;
    estado_nuevo: string;
    modificado_por_id: number;
    //comentario?: string;
  }[];
  items: ArticuloDevuelto[];
  // Los siguientes son opcionales y pueden no estar en todas las devoluciones
  tipoDevolucion?: "Mixta" | "Reembolso" | "Reemplazo";
  datosCliente?: {
    nombres: string;
    telefono: string;
    direccion: string;
  };
  resolucionFinanciera?: any;
  reembolso?: any;
}
