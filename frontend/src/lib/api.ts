import axios from 'axios';

// URL del backend PHP — las rutas están registradas bajo /api/v1/
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el token en cada request
api.interceptors.request.use((config) => {
  // En un caso real, leerías esto de las cookies o localStorage
  // Para este desarrollo, usaremos el token de prueba validado en AuthMiddleware
  const token = typeof window !== 'undefined' ? localStorage.getItem('sicodi_token') : null;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Para simplificar la prueba y no crear la pantalla de login ahora mismo
    config.headers.Authorization = `Bearer sicodi-valid-test-token`;
  }
  
  return config;
});

export default api;
