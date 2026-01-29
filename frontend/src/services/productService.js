import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para debuggear requests
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Error en request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para debuggear responses
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ Error ${error.response?.status || 'NO STATUS'} ${error.config?.url}`);
    console.error('Detalles del error:', error.response?.data);
    return Promise.reject(error);
  }
);

export const productService = {
  getPublicProducts: () => api.get('/public/products'),
  getAllProducts: () => api.get('/products'),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/categories'),
};

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  
  // Función auxiliar para ver estructura de respuesta
  testLogin: async () => {
    try {
      const response = await api.post('/auth/login', {
        email: 'admin@test.com',
        password: '123456'
      });
      console.log('🎯 Estructura de prueba:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error en prueba:', error.response?.data);
      throw error;
    }
  }
};