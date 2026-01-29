import axios from 'axios';

// Configurar axios con la URL base del backend
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000', // Puerto de tu backend Express
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Para enviar cookies si usas autenticación
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirigir a login si no está autenticado
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;