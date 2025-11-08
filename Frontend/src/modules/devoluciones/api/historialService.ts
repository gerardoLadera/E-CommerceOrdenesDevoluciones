// src/modules/devoluciones/api/historialService.ts
import { API_DEVOLUCIONES } from './api';
import type {
  DevolucionHistorial,
  CreateDevolucionHistorialDto,
  UpdateDevolucionHistorialDto,
} from '../types/devolucion';

export const historialService = {
  // Crear registro de historial
  create: async (data: CreateDevolucionHistorialDto): Promise<DevolucionHistorial> => {
    const response = await API_DEVOLUCIONES.post<DevolucionHistorial>('/devolucion-historial', data);
    return response.data;
  },

  // Obtener todos los registros de historial
  findAll: async (): Promise<DevolucionHistorial[]> => {
    const response = await API_DEVOLUCIONES.get<DevolucionHistorial[]>('/devolucion-historial');
    return response.data;
  },

  // Obtener historial por devolución específica
  findByDevolucion: async (devolucionId: string): Promise<DevolucionHistorial[]> => {
    const response = await API_DEVOLUCIONES.get<DevolucionHistorial[]>(
      `/devolucion-historial/devolucion/${devolucionId}`
    );
    return response.data;
  },

  // Obtener un registro de historial por ID
  findOne: async (id: string): Promise<DevolucionHistorial> => {
    const response = await API_DEVOLUCIONES.get<DevolucionHistorial>(`/devolucion-historial/${id}`);
    return response.data;
  },

  // Actualizar registro de historial
  update: async (id: string, data: UpdateDevolucionHistorialDto): Promise<DevolucionHistorial> => {
    const response = await API_DEVOLUCIONES.patch<DevolucionHistorial>(
      `/devolucion-historial/${id}`,
      data
    );
    return response.data;
  },

  // Eliminar registro de historial
  remove: async (id: string): Promise<void> => {
    await API_DEVOLUCIONES.delete(`/devolucion-historial/${id}`);
  },
};
