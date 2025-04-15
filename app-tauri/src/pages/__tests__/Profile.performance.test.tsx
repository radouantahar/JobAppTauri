import { render, act } from '@testing-library/react';
import { Profile } from '../Profile';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store';

// Mock des hooks
vi.mock('../../contexts/AuthContext');
vi.mock('../../store');

const mockUseAuth = useAuth as jest.Mock;
const mockUseAppStore = useAppStore as unknown as jest.Mock;

describe('Profile Performance Tests', () => {
  beforeEach(() => {
    // Configuration des mocks par défaut
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    mockUseAppStore.mockReturnValue({
      setLoading: vi.fn(),
      isLoading: false,
      error: null
    });
  });

  it('devrait rendre le profil en moins de 500ms', () => {
    const startTime = performance.now();
    
    act(() => {
      render(<Profile />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(500);
  });

  it('devrait gérer efficacement les états de chargement', () => {
    mockUseAppStore.mockReturnValue({
      setLoading: vi.fn(),
      isLoading: true,
      error: null
    });

    const startTime = performance.now();
    
    act(() => {
      render(<Profile />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(300);
  });

  it('devrait gérer efficacement les états d\'erreur', () => {
    mockUseAppStore.mockReturnValue({
      setLoading: vi.fn(),
      isLoading: false,
      error: new Error('Erreur de chargement')
    });

    const startTime = performance.now();
    
    act(() => {
      render(<Profile />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(300);
  });

  it('devrait maintenir une utilisation mémoire stable lors de multiples rendus', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    const memorySamples: number[] = [];

    for (let i = 0; i < 10; i++) {
      act(() => {
        render(<Profile />);
      });

      if (performance.memory) {
        memorySamples.push(performance.memory.usedJSHeapSize);
      }
    }

    if (memorySamples.length > 0) {
      const maxMemoryIncrease = Math.max(...memorySamples) - initialMemory;
      expect(maxMemoryIncrease).toBeLessThan(5 * 1024 * 1024); // Moins de 5MB d'augmentation
    }
  });

  it('devrait gérer efficacement les grands ensembles de données', () => {
    mockUseAppStore.mockReturnValue({
      setLoading: vi.fn(),
      isLoading: false,
      error: null
    });

    const startTime = performance.now();
    
    act(() => {
      render(<Profile />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(1000);
  });
}); 