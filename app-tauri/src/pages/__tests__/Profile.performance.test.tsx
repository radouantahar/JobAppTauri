import React from 'react';
import { render, act } from '@testing-library/react';
import { ProfilePage } from '../Profile';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';

// Mock des hooks
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useProfile');

const mockUseAuth = useAuth as jest.Mock;
const mockUseProfile = useProfile as jest.Mock;

describe('ProfilePage Performance Tests', () => {
  beforeEach(() => {
    // Configuration des mocks par défaut
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    mockUseProfile.mockReturnValue({
      profile: {
        name: 'John Doe',
        email: 'john@example.com',
        location: 'Paris',
        experienceLevel: 'mid',
        skills: ['React', 'TypeScript'],
        cv: {
          content: 'Contenu du CV',
          lastUpdated: new Date().toISOString(),
        },
      },
      isLoading: false,
      error: null,
      updateProfile: jest.fn(),
    });
  });

  it('devrait rendre le profil en moins de 500ms', () => {
    const startTime = performance.now();
    
    act(() => {
      render(<ProfilePage />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(500);
  });

  it('devrait gérer efficacement les états de chargement', () => {
    mockUseProfile.mockReturnValue({
      profile: null,
      isLoading: true,
      error: null,
      updateProfile: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<ProfilePage />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(300);
  });

  it('devrait gérer efficacement les états d\'erreur', () => {
    mockUseProfile.mockReturnValue({
      profile: null,
      isLoading: false,
      error: new Error('Erreur de chargement'),
      updateProfile: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<ProfilePage />);
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
        render(<ProfilePage />);
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
    mockUseProfile.mockReturnValue({
      profile: {
        name: 'John Doe',
        email: 'john@example.com',
        location: 'Paris',
        experienceLevel: 'mid',
        skills: Array(100).fill('').map((_, i) => `Skill ${i}`),
        cv: {
          content: 'Contenu du CV'.repeat(1000),
          lastUpdated: new Date().toISOString(),
        },
      },
      isLoading: false,
      error: null,
      updateProfile: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<ProfilePage />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(1000);
  });
}); 