'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiClient } from '../lib/api-client';

interface AuthContextProps {
  user: any | null;
  token: string | null;
  tenantId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('Mudar_token');
    const savedUser = localStorage.getItem('Mudar_user');
    const savedTenantId = localStorage.getItem('Mudar_tenant_id');

    if (savedToken && savedUser && savedTenantId) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setTenantId(savedTenantId);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data: any = await ApiClient.post('/auth/login', { email, password });
      
      setUser(data.user);
      setToken(data.accessToken);
      setTenantId(data.user.tenantId);

      localStorage.setItem('Mudar_token', data.accessToken);
      localStorage.setItem('Mudar_user', JSON.stringify(data.user));
      localStorage.setItem('Mudar_tenant_id', data.user.tenantId);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setTenantId(null);
    localStorage.removeItem('Mudar_token');
    localStorage.removeItem('Mudar_user');
    localStorage.removeItem('Mudar_tenant_id');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, token, tenantId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

