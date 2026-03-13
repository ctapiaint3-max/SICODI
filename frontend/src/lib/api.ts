import axios from 'axios';

// URL base relativa — Next.js hará el proxy hacia el backend PHP (Render) 
// vía la configuración de 'rewrites' en next.config.mjs
const api = axios.create({
  baseURL: '/api/v1',
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
