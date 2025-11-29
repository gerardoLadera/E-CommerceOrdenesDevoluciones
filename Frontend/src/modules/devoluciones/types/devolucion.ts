// src/modules/ordenes/types/devolucion.ts

import type { EstadoDevolucion, AccionItemDevolucion, EstadoReembolso, TipoAjuste } from './enums';

export interface Devolucion {
  id: string;
  orderId: string;
  createdAt: string;
  estado: EstadoDevolucion;
  fecha_procesamiento: string | null;
  orden_reemplazo_id: string | null;
  historial?: DevolucionHistorial[];
  items?: ItemDevolucion[];
  reembolso?: Reembolso;  // Singular: solo un reembolso
  reemplazos?: Reemplazo[];  // Plural: múltiples reemplazos
}

export interface CreateDevolucionDto {
  orderId: string;
  estado: EstadoDevolucion;
  fecha_procesamiento?: string;
  orden_reemplazo_id?: string;
}

export interface UpdateDevolucionDto {
  orderId?: string;
  estado?: EstadoDevolucion;
  fecha_procesamiento?: string;
  orden_reemplazo_id?: string;
}

export interface AprobarDevolucionDto {
  adminId: number;
  comentario?: string;
  metodoDevolucion?: string;
}

export interface RechazarDevolucionDto {
  adminId: number;
  motivo: string;
  comentario?: string;
}

export interface DireccionEnvio {
  calle: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  pais: string;
}

export interface Instrucciones {
  pasos: string[];
  direccionEnvio?: DireccionEnvio;
  metodoDevolucion: string;
  plazoLimite: string;
  etiquetaEnvio?: string;
}

export interface ItemDevolucionInfo {
  itemId: string;
  productoNombre: string;
  cantidad: number;
  razon: string;
}

export interface InstruccionesDevolucion {
  devolucionId: string;
  orderId: string;
  numeroAutorizacion: string;
  fechaAprobacion: string;
  instrucciones: Instrucciones;
  items: ItemDevolucionInfo[];
  informacionAdicional: string[];
}

export interface AprobarDevolucionResponse {
  devolucion: Devolucion;
  instrucciones: InstruccionesDevolucion;
}

export interface ItemDevolucion {
  id: string;
  devolucion_id: string;
  producto_id: number;
  cantidad: number;
  precio_compra: number;
  tipo_accion: AccionItemDevolucion;
  moneda: string;
  motivo: string;
  devolucion?: Devolucion;
  reemplazo?: Reemplazo;
}

export interface CreateItemsDevolucionDto {
  devolucion_id: string;
  producto_id: number;
  cantidad: number;
  precio_compra: number;
  tipo_accion: AccionItemDevolucion;
  moneda: string;
  motivo: string;
}

export interface UpdateItemsDevolucionDto {
  devolucion_id?: string;
  producto_id?: number;
  cantidad?: number;
  precio_compra?: number;
  tipo_accion?: AccionItemDevolucion;
  moneda?: string;
  motivo?: string;
}

export interface Reembolso {
  id: string;
  devolucion_id: string;
  monto: number;
  fecha_procesamiento: string;
  estado: EstadoReembolso;
  transaccion_id: string;
  moneda: string;
  devolucion?: Devolucion;
}

export interface CreateReembolsoDto {
  devolucion_id: string;
  monto: number;
  fecha_procesamiento: string;
  estado: string;
  transaccion_id: string;
  moneda: string;
}

export interface UpdateReembolsoDto {
  devolucion_id?: string;
  monto?: number;
  fecha_procesamiento?: string;
  estado?: string;
  transaccion_id?: string;
  moneda?: string;
}

export interface Reemplazo {
  id: string;
  devolucion_id: string;
  item_devolucion_id: string;
  producto_id: number;
  precio_reemplazo: number;
  ajuste_tipo: TipoAjuste;
  moneda: string;
  devolucion?: Devolucion;
  itemDevolucion?: ItemDevolucion;
}

export interface CreateReemplazoDto {
  devolucion_id: string;
  item_devolucion_id: string;
  producto_id: number;
  precio_reemplazo: number;
  ajuste_tipo: string;
  moneda: string;
}

export interface UpdateReemplazoDto {
  devolucion_id?: string;
  item_devolucion_id?: string;
  producto_id?: number;
  precio_reemplazo?: number;
  ajuste_tipo?: string;
  moneda?: string;
}

export interface DevolucionHistorial {
  id: string;
  devolucion_id: string;
  estado_anterior: EstadoDevolucion;
  estado_nuevo: EstadoDevolucion;
  comentario: string | null;
  fecha_creacion: string;
  modificado_por_id: number;
  devolucion?: Devolucion;
}

export interface CreateDevolucionHistorialDto {
  devolucion_id: string;
  estado_anterior: EstadoDevolucion;
  estado_nuevo: EstadoDevolucion;
  comentario?: string;
  modificado_por_id: number;
}

export interface UpdateDevolucionHistorialDto {
  devolucion_id?: string;
  estado_anterior?: EstadoDevolucion;
  estado_nuevo?: EstadoDevolucion;
  comentario?: string;
  modificado_por_id?: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface ApiErrorResponse {
  response: {
    data: ApiError;
    status: number;
    statusText: string;
  };
}
