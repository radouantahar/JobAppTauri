import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAppStore } from '../store';
import { authService } from '../services/api';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: string; email: string } | null;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, name: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setLoading } = useAppStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  const login = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const user = await authService.login(email);
      setIsAuthenticated(true);
      setUser(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const register = useCallback(async (email: string, name: string) => {
    setLoading(true);
    try {
      const user = await authService.register(email, name);
      setIsAuthenticated(true);
      setUser(user);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, register }}>
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