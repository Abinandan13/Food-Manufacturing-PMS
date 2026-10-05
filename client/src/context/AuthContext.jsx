import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, check if a token exists and try to restore the session.
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      const cachedUser = localStorage.getItem('user');

      if (!token) {
        setLoading(false);
        return;
      }

      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          // ignore malformed cache
        }
      }

      try {
        const res = await authService.getMe();
        if (res.success) {
          setUser(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      } catch {
        // token invalid/expired — clear session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = async (username, password) => {
    const res = await authService.login(username, password);
    if (res.success) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
