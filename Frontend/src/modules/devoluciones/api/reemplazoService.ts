// src/modules/devoluciones/api/reemplazoService.ts
import { API_DEVOLUCIONES } from './api';
import type {
  Reemplazo,
  CreateReemplazoDto,
  UpdateReemplazoDto,
  ItemDevolucion,
} from '../types/devolucion';

// Tipo para el item con reemplazo en bulk
export interface ItemConReemplazoDto {
  producto_devuelto_id: number;
  cantidad_devuelta: number;
  precio_compra: number;
  motivo: string;
  producto_reemplazo_id: number;
  precio_reemplazo: number;
  ajuste_tipo: string;
}

// Tipo para crear múltiples reemplazos
export interface CreateBulkReemplazoDto {
  devolucion_id: string;
  moneda: string;
  items: ItemConReemplazoDto[];
}

// Respuesta del endpoint bulk
export interface BulkReemplazoResponse {
  itemsDevolucion: ItemDevolucion[];
  reemplazos: Reemplazo[];
}

export const reemplazoService = {
  // Crear reemplazo
  create: async (data: CreateReemplazoDto): Promise<Reemplazo> => {
    const response = await API_DEVOLUCIONES.post<Reemplazo>('/reemplazo', data);
    return response.data;
  },

  // Crear múltiples reemplazos con sus items de devolución
  createBulk: async (data: CreateBulkReemplazoDto): Promise<BulkReemplazoResponse> => {
    const response = await API_DEVOLUCIONES.post<BulkReemplazoResponse>('/reemplazo/bulk', data);
    return response.data;
  },

  // Obtener todos los reemplazos
  findAll: async (): Promise<Reemplazo[]> => {
    const response = await API_DEVOLUCIONES.get<Reemplazo[]>('/reemplazo');
    return response.data;
  },

  // Obtener un reemplazo por ID
  findOne: async (id: string): Promise<Reemplazo> => {
    const response = await API_DEVOLUCIONES.get<Reemplazo>(`/reemplazo/${id}`);
    return response.data;
  },

  // Actualizar reemplazo
  update: async (id: string, data: UpdateReemplazoDto): Promise<Reemplazo> => {
    const response = await API_DEVOLUCIONES.patch<Reemplazo>(`/reemplazo/${id}`, data);
    return response.data;
  },

  // Eliminar reemplazo
  remove: async (id: string): Promise<void> => {
    await API_DEVOLUCIONES.delete(`/reemplazo/${id}`);
  },
};
