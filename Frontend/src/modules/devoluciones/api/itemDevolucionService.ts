// src/modules/devoluciones/api/itemDevolucionService.ts
import { API_DEVOLUCIONES } from './api';
import type {
  ItemDevolucion,
  CreateItemsDevolucionDto,
  UpdateItemsDevolucionDto,
} from '../types/devolucion';

export const itemDevolucionService = {
  // Crear item de devolución
  create: async (data: CreateItemsDevolucionDto): Promise<ItemDevolucion> => {
    const response = await API_DEVOLUCIONES.post<ItemDevolucion>('/items-devolucion', data);
    return response.data;
  },

  // Obtener todos los items de devolución
  findAll: async (): Promise<ItemDevolucion[]> => {
    const response = await API_DEVOLUCIONES.get<ItemDevolucion[]>('/items-devolucion');
    return response.data;
  },

  // Obtener un item de devolución por ID
  findOne: async (id: string): Promise<ItemDevolucion> => {
    const response = await API_DEVOLUCIONES.get<ItemDevolucion>(`/items-devolucion/${id}`);
    return response.data;
  },

  // Actualizar item de devolución
  update: async (id: string, data: UpdateItemsDevolucionDto): Promise<ItemDevolucion> => {
    const response = await API_DEVOLUCIONES.patch<ItemDevolucion>(`/items-devolucion/${id}`, data);
    return response.data;
  },

  // Eliminar item de devolución
  remove: async (id: string): Promise<void> => {
    await API_DEVOLUCIONES.delete(`/items-devolucion/${id}`);
  },
};
