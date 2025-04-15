import { authService } from '../api';
import { invoke } from '@tauri-apps/api/core';

jest.mock('@tauri-apps/api/core');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait se connecter avec succès', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    (invoke as jest.Mock).mockResolvedValue(mockUser);

    const result = await authService.login('test@example.com');

    expect(invoke).toHaveBeenCalledWith('login', { email: 'test@example.com' });
    expect(result).toEqual(mockUser);
  });

  it('devrait s\'inscrire avec succès', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    (invoke as jest.Mock).mockResolvedValue(mockUser);

    const result = await authService.register('test@example.com', 'Test User');

    expect(invoke).toHaveBeenCalledWith('register', { 
      email: 'test@example.com',
      name: 'Test User'
    });
    expect(result).toEqual(mockUser);
  });

  it('devrait se déconnecter avec succès', async () => {
    (invoke as jest.Mock).mockResolvedValue(undefined);

    await authService.logout();

    expect(invoke).toHaveBeenCalledWith('logout');
  });
}); 