// src/modules/devoluciones/api/reemplazoService.ts
import { API_DEVOLUCIONES } from './api';
import type {
  Reemplazo,
  CreateReemplazoDto,
  UpdateReemplazoDto,
} from '../types/devolucion';

export const reemplazoService = {
  // Crear reemplazo
  create: async (data: CreateReemplazoDto): Promise<Reemplazo> => {
    const response = await API_DEVOLUCIONES.post<Reemplazo>('/reemplazo', data);
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
