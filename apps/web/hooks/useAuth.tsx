'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (api.isAuthenticated()) {
      api.getMe()
        .then((res: any) => setUser(res.data))
        .catch(() => api.clearTokens())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    api.setTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const result = await api.register(email, password, name);
    api.setTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    api.clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
