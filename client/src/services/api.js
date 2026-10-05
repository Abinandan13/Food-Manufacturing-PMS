import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the auth token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response handling: unwrap and redirect to login on 401.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const createEndpointAPI = (basePath) => ({
  getAll: (params) => api.get(basePath, { params }),
  list: (params) => api.get(basePath, { params }),
  get: (id) => api.get(`${basePath}/${id}`),
  getById: (id) => api.get(`${basePath}/${id}`),
  create: (data) => api.post(basePath, data),
  update: (id, data) => api.put(`${basePath}/${id}`, data),
  delete: (id) => api.delete(`${basePath}/${id}`),
  remove: (id) => api.delete(`${basePath}/${id}`),
});

export const productsAPI = createEndpointAPI('/products');
export const demandsAPI = createEndpointAPI('/demands');
export const productionPlansAPI = createEndpointAPI('/production-plans');
export const rawMaterialsAPI = createEndpointAPI('/raw-materials');
export const bomAPI = {
  ...createEndpointAPI('/bom'),
  getRequirements: (productId, quantity) =>
    api.get(`/bom/product/${productId}/requirements`, { params: { quantity } }),
};
export const inventoryAPI = createEndpointAPI('/inventory');
export const progressAPI = createEndpointAPI('/production-progress');
export const alertsAPI = {
  ...createEndpointAPI('/alerts'),
  markRead: (id) => api.put(`/alerts/${id}/read`),
};
export const reportsAPI = {
  getSummary: () => api.get('/reports/summary'),
  getProduction: (params) => api.get('/reports/production', { params }),
  getInventory: () => api.get('/reports/inventory'),
  getDemands: (params) => api.get('/reports/demands', { params }),
};
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
  getAdmin: () => api.get('/dashboard/admin'),
  getProduction: () => api.get('/dashboard/production'),
  getInventory: () => api.get('/dashboard/inventory'),
};
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};
export const usersAPI = {
  getAll: () => api.get('/auth/users'),
  create: (data) => api.post('/auth/register', data),
  update: (id, data) => api.put(`/auth/users/${id}`, data),
  delete: (id) => api.delete(`/auth/users/${id}`),
};

export default api;
