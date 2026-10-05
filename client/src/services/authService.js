import api from './api';

export const authService = {
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data; // { success, token, user }
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data; // { success, user }
  },
};
