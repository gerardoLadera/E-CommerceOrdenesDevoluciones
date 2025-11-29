// src/modules/devoluciones/api/reembolsoService.ts
import { API_DEVOLUCIONES } from './api';
import type {
  Reembolso,
  CreateReembolsoDto,
  UpdateReembolsoDto,
} from '../types/devolucion';

export const reembolsoService = {
  // Crear reembolso
  create: async (data: CreateReembolsoDto): Promise<Reembolso> => {
    const response = await API_DEVOLUCIONES.post<Reembolso>('/reembolso', data);
    return response.data;
  },

  // Obtener todos los reembolsos
  findAll: async (): Promise<Reembolso[]> => {
    const response = await API_DEVOLUCIONES.get<Reembolso[]>('/reembolso');
    return response.data;
  },

  // Obtener un reembolso por ID
  findOne: async (id: string): Promise<Reembolso> => {
    const response = await API_DEVOLUCIONES.get<Reembolso>(`/reembolso/${id}`);
    return response.data;
  },

  // Actualizar reembolso
  update: async (id: string, data: UpdateReembolsoDto): Promise<Reembolso> => {
    const response = await API_DEVOLUCIONES.patch<Reembolso>(`/reembolso/${id}`, data);
    return response.data;
  },

  // Eliminar reembolso
  remove: async (id: string): Promise<void> => {
    await API_DEVOLUCIONES.delete(`/reembolso/${id}`);
  },
};
