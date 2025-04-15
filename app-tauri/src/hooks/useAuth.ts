import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        // TODO: Implémenter l'appel à l'API
        await new Promise(resolve => setTimeout(resolve, 1000));
        set({
          user: {
            id: '1',
            email,
            name: 'Test User'
          },
          isAuthenticated: true
        });
      },
      logout: () => {
        set({
          user: null,
          isAuthenticated: false
        });
      },
      register: async (email: string, password: string, name: string) => {
        // TODO: Implémenter l'appel à l'API
        await new Promise(resolve => setTimeout(resolve, 1000));
        set({
          user: {
            id: '1',
            email,
            name
          },
          isAuthenticated: true
        });
      }
    }),
    {
      name: 'auth-storage'
    }
  )
); 