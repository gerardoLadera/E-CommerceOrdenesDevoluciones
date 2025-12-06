//import { API_RETURNS } from "../api";
import type { DetalleDevolucion } from "../../types/devolucion";
import { API_ORDERS_QUERY, API_UPDATE, API_RETURNS } from "../api";

// Interfaz para la respuesta del endpoint de aprobación
export interface DevolucionActualizada {
  id: string;
  estado: string;
  reembolso_id: string | null;
}

// Interfaz para un objeto en la lista de devoluciones (coincide con la entidad del backend)
export interface DevolucionEnLista {
  id: string;
  codDevolucion: string;
  orderId: string;
  codOrden?: string;
  createdAt: string; // La fecha viene como string ISO
  estado: string;
  // Estos campos pueden ser null o no existir, los hacemos opcionales
  tipoDevolucion?: string;
  nombreCliente?: string; // Este campo probablemente necesites añadirlo en el backend
  montoTotal?: number; // Este campo probablemente necesites añadirlo en el backend
}

/**
 * Llama al endpoint del backend para aprobar una devolución y disparar el reembolso automático.
 * @param idDevolucion - El ID de la devolución a aprobar.
 */
export const aprobarDevolucion = async (
  idDevolucion: string
): Promise<DevolucionActualizada> => {
  const { data } = await API_ORDERS_QUERY.post<DevolucionActualizada>(
    `/api/devolucion/${idDevolucion}/refund`
  );
  return data;
};

/**
 * Obtiene los detalles completos de una devolución por su ID.
 * @param idDevolucion - El ID de la devolución a consultar.
 */

export const getDevolucionById = async (
  idDevolucion: string
): Promise<DetalleDevolucion> => {
  const { data } = await API_ORDERS_QUERY.get<DetalleDevolucion>(
    `/api/devolucion/${idDevolucion}`
  );
  return data;
};
/**
 * Obtiene una lista de todas las devoluciones desde el backend.
 */
export const getDevoluciones = async (): Promise<DevolucionEnLista[]> => {
  const { data } =
    await API_ORDERS_QUERY.get<DevolucionEnLista[]>("/api/devolucion"); // ¡Asegúrate de que /api/ esté aquí!
  return data;
};
