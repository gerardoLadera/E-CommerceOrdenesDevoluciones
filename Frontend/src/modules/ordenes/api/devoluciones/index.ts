import { API_UPDATE, API_RETURNS } from "../api";
import type { DetalleDevolucion } from "../../types/devolucion";

// Interfaz para la respuesta que esperamos del backend
export interface DevolucionActualizada {
  id: string;
  estado: string;
  reembolso_id: string | null;
  // Añade otros campos que devuelva tu API si los necesitas
}

export const aprobarDevolucion = async (idDevolucion: string): Promise<DevolucionActualizada> => {
  const { data } = await API_RETURNS.post<DevolucionActualizada>(`/devolucion/${idDevolucion}/approve`);
  return data;
};

export const getDevolucionById = async (idDevolucion: string): Promise<DetalleDevolucion> => {
  const { data } = await API_RETURNS.get<DetalleDevolucion>(`/devolucion/${idDevolucion}`);
  return data;
};