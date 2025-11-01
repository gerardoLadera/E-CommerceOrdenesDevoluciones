import { API_UPDATE } from "./api"; // Usamos API_UPDATE porque es una acción de escritura (comando)

// Función para llamar al endpoint de aprobación que creamos en el backend
export const aprobarDevolucion = async (idDevolucion: string) => {
  const { data } = await API_UPDATE.post(`/devolucion/${idDevolucion}/approve`);
  return data;
};