import axios from "axios";

export const API_DEVOLUCIONES = axios.create({
  baseURL: import.meta.env.MODE === "production"
    ? "http://localhost:3003" // TODO: Actualizar URL de producción
    : "http://localhost:3003",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para añadir token en cada request
API_DEVOLUCIONES.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta (manejo de errores y redirección)
API_DEVOLUCIONES.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
