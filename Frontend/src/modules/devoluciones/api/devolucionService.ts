// src/modules/devoluciones/api/devolucionService.ts
import { API_DEVOLUCIONES } from './api';
import type {
  Devolucion,
  CreateDevolucionDto,
  UpdateDevolucionDto,
  AprobarDevolucionDto,
  RechazarDevolucionDto,
  AprobarDevolucionResponse,
} from '../types/devolucion';

export const devolucionService = {
  // Crear devolución
  create: async (data: CreateDevolucionDto): Promise<Devolucion> => {
    const response = await API_DEVOLUCIONES.post<Devolucion>('/devolucion', data);
    return response.data;
  },

  // Obtener todas las devoluciones
  findAll: async (): Promise<Devolucion[]> => {
    const response = await API_DEVOLUCIONES.get<Devolucion[]>('/devolucion');
    return response.data;
  },

  // Obtener una devolución por ID
  findOne: async (id: string): Promise<Devolucion> => {
    const response = await API_DEVOLUCIONES.get<Devolucion>(`/devolucion/${id}`);
    return response.data;
  },

  // Actualizar devolución
  update: async (id: string, data: UpdateDevolucionDto): Promise<Devolucion> => {
    const response = await API_DEVOLUCIONES.patch<Devolucion>(`/devolucion/${id}`, data);
    return response.data;
  },

  // Eliminar devolución
  remove: async (id: string): Promise<void> => {
    await API_DEVOLUCIONES.delete(`/devolucion/${id}`);
  },

  // Aprobar devolución
  aprobar: async (id: string, data: AprobarDevolucionDto): Promise<AprobarDevolucionResponse> => {
    const response = await API_DEVOLUCIONES.patch<AprobarDevolucionResponse>(
      `/devolucion/${id}/aprobar`,
      data
    );
    return response.data;
  },

  // Rechazar devolución
  rechazar: async (id: string, data: RechazarDevolucionDto): Promise<Devolucion> => {
    const response = await API_DEVOLUCIONES.patch<Devolucion>(`/devolucion/${id}/rechazar`, data);
    return response.data;
  },

  // Marcar como completada
  markAsCompleted: async (id: string): Promise<Devolucion> => {
    const response = await API_DEVOLUCIONES.patch<Devolucion>(`/devolucion/${id}/complete`);
    return response.data;
  },

  // Cancelar devolución
  markAsCancelled: async (id: string): Promise<Devolucion> => {
    const response = await API_DEVOLUCIONES.patch<Devolucion>(`/devolucion/${id}/cancel`);
    return response.data;
  },
};
