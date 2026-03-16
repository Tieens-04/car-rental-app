import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('accessToken');
    return Boolean(token && !user);
  });

  const clearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const shouldFetchProfile = Boolean(token && !user);

    if (shouldFetchProfile) {
      authAPI.getMe()
        .then(({ data }) => {
          setUser(data.data);
          localStorage.setItem('user', JSON.stringify(data.data));
        })
        .catch(() => {
          clearAuth();
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    return data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch { /* ignore */ }
    clearAuth();
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
