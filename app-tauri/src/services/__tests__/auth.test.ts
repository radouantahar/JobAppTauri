import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';
import { login, register, logout, getCurrentUser } from '../api';

// Mock de l'API Tauri
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('devrait se connecter avec succès avec des identifiants valides', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      };

      (invoke as any).mockResolvedValueOnce(mockUser);

      const result = await login('test@example.com', 'password123');

      expect(result).toEqual(mockUser);
      expect(invoke).toHaveBeenCalledWith('login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('devrait gérer les identifiants invalides', async () => {
      (invoke as any).mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('register', () => {
    it('devrait enregistrer un nouvel utilisateur avec succès', async () => {
      const mockUser = {
        id: 1,
        email: 'new@example.com',
        name: 'New User',
      };

      (invoke as any).mockResolvedValueOnce(mockUser);

      const result = await register('new@example.com', 'password123', 'New User');

      expect(result).toEqual(mockUser);
      expect(invoke).toHaveBeenCalledWith('register', {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      });
    });

    it('devrait gérer l\'erreur si l\'email existe déjà', async () => {
      (invoke as any).mockRejectedValueOnce(new Error('Email already exists'));

      await expect(
        register('existing@example.com', 'password123', 'Existing User')
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('logout', () => {
    it('devrait se déconnecter avec succès', async () => {
      (invoke as any).mockResolvedValueOnce(true);

      const result = await logout();

      expect(result).toBe(true);
      expect(invoke).toHaveBeenCalledWith('logout');
    });

    it('devrait gérer les erreurs de déconnexion', async () => {
      (invoke as any).mockRejectedValueOnce(new Error('Logout failed'));

      await expect(logout()).rejects.toThrow('Logout failed');
    });
  });

  describe('getCurrentUser', () => {
    it('devrait retourner l\'utilisateur actuel quand connecté', async () => {
      const mockUser = {
        id: 1,
        email: 'current@example.com',
        name: 'Current User',
      };

      (invoke as any).mockResolvedValueOnce(mockUser);

      const result = await getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(invoke).toHaveBeenCalledWith('get_current_user');
    });

    it('devrait retourner null quand non connecté', async () => {
      (invoke as any).mockResolvedValueOnce(null);

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });
  });
}); 