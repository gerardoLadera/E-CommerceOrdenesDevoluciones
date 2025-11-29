// Define y exporta el tipo de estado para que sea reusable
export type EstadoDevolucion = "SOLICITADO" | "APROBADO" | "RECHAZADO" | "PROCESANDO" | "COMPLETADA" | "ERROR_REEMBOLSO" | "pendiente";

export interface ArticuloDevuelto {
  id: string;
  tipo_accion: string;
  producto_id: string;
  precio_compra: number;
  cantidad: number;
  motivo: string;
}

export interface DetalleDevolucion {
  id: string;
  codDevolucion?: string;
  orderId: string;
  codOrden?: string;
  estado: EstadoDevolucion;
  historial: {
    fecha_creacion: string;
    estado_nuevo: string;
    modificado_por_id: number;
    comentario?: string;
  }[];
  items: ArticuloDevuelto[];
  // Los siguientes son opcionales y pueden no estar en todas las devoluciones
  tipoDevolucion?: "Mixta" | "Reembolso" | "Reemplazo";
  datosCliente?: {
    nombres: string;
    telefono: string;
    idUsuario: string | number;
};
  resolucionFinanciera?: any;
  reembolso?: any;
}