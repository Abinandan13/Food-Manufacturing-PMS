import api from './api';

/**
 * Generic CRUD helper factory for a REST resource, matching the
 * { success, data } response shape used by every controller in this app.
 *
 * Usage:
 *   const productsApi = createResourceApi('/products');
 *   const { data } = await productsApi.list({ category: 'Dairy' });
 */
export function createResourceApi(path) {
  return {
    list: async (params = {}) => {
      const res = await api.get(path, { params });
      return res.data; // { success, count, data }
    },
    get: async (id) => {
      const res = await api.get(`${path}/${id}`);
      return res.data; // { success, data }
    },
    create: async (payload) => {
      const res = await api.post(path, payload);
      return res.data;
    },
    update: async (id, payload) => {
      const res = await api.put(`${path}/${id}`, payload);
      return res.data;
    },
    remove: async (id) => {
      const res = await api.delete(`${path}/${id}`);
      return res.data;
    },
  };
}
