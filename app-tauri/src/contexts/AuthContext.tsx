import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../store';
import { authService } from '../services/api';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: string; email: string } | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setLoading } = useAppStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Vérifier le token au chargement
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const user = await authService.verifyToken(token);
          setIsAuthenticated(true);
          setUser(user);
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    };

    verifyToken();
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { id, email: userEmail, token: newToken } = await authService.login(email, password);
      setIsAuthenticated(true);
      setUser({ id, email: userEmail });
      setToken(newToken);
      localStorage.setItem('token', newToken);
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
      if (token) {
        await authService.logout(token);
      }
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, token]);

  const register = useCallback(async (email: string, name: string, password: string) => {
    setLoading(true);
    try {
      const { id, email: userEmail, token: newToken } = await authService.register(email, name, password);
      setIsAuthenticated(true);
      setUser({ id, email: userEmail });
      setToken(newToken);
      localStorage.setItem('token', newToken);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, register }}>
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