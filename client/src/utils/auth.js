export const setToken = (token) => localStorage.setItem('token', token);
export const getToken = () => localStorage.getItem('token');
export const removeToken = () => localStorage.removeItem('token');

export const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); }
  catch { return null; }
};
export const removeUser = () => localStorage.removeItem('user');

export const isAuthenticated = () => !!getToken();

export const logout = () => {
  removeToken();
  removeUser();
};
