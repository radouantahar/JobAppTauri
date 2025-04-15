import { render, act } from '@testing-library/react';
import { JobModal } from '../JobModal';
import { useAuth } from '../../contexts/AuthContext';
import { useJob } from '../../hooks/useJob';
import { vi } from 'vitest';

// Configuration des mocks pour les hooks
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../hooks/useJob', () => ({
  useJob: vi.fn()
}));
const mockUseAuth = useAuth as vi.Mock;
const mockUseJob = useJob as vi.Mock;

describe('JobModal Performance Tests', () => {
  const mockJob = {
    id: '1',
    title: 'Développeur React',
    company: 'TechCorp',
    location: 'Paris',
    description: 'Description du poste',
    url: 'https://example.com/job',
    source: 'linkedin',
    publishedAt: new Date().toISOString(),
    salary: {
      min: 45000,
      max: 55000,
      currency: 'EUR',
      period: 'year'
    },
    matchingScore: 0.85,
    skills: ['React', 'TypeScript'],
    experienceLevel: 'mid',
    commuteTimes: {
      primaryHome: {
        duration: 30,
        distance: 5,
        mode: 'transit'
      }
    }
  };

  beforeEach(() => {
    // Configuration des mocks par défaut
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    mockUseJob.mockReturnValue({
      job: mockJob,
      isLoading: false,
      error: null,
      applyToJob: vi.fn(),
      saveJob: vi.fn(),
    });
  });

  it('devrait ouvrir le modal en moins de 300ms', () => {
    const startTime = performance.now();
    
    act(() => {
      render(<JobModal jobId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(300);
  });

  it('devrait gérer efficacement les états de chargement', () => {
    mockUseJob.mockReturnValue({
      job: null,
      isLoading: true,
      error: null,
      applyToJob: jest.fn(),
      saveJob: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<JobModal jobId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(200);
  });

  it('devrait gérer efficacement les états d\'erreur', () => {
    mockUseJob.mockReturnValue({
      job: null,
      isLoading: false,
      error: new Error('Erreur de chargement'),
      applyToJob: jest.fn(),
      saveJob: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<JobModal jobId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(200);
  });
  it('devrait maintenir une utilisation mémoire stable lors de multiples ouvertures/fermetures', () => {
    // Utilisation de window.performance.memory qui est disponible dans Chrome
    const initialMemory = (window.performance as any).memory?.usedJSHeapSize || 0;
    const memorySamples: number[] = [];

    for (let i = 0; i < 10; i++) {
      act(() => {
        render(<JobModal jobId="1" onClose={() => {}} />);
      });
      if ((window.performance as any).memory) {
        memorySamples.push((window.performance as any).memory.usedJSHeapSize);
      }
    }

    if (memorySamples.length > 0) {
      const maxMemoryIncrease = Math.max(...memorySamples) - initialMemory;
      expect(maxMemoryIncrease).toBeLessThan(3 * 1024 * 1024); // Moins de 3MB d'augmentation
    }
  });

  it('devrait gérer efficacement les descriptions longues', () => {
    const longDescriptionJob = {
      ...mockJob,
      description: 'Description très longue'.repeat(1000),
    };

    mockUseJob.mockReturnValue({
      job: longDescriptionJob,
      isLoading: false,
      error: null,
      applyToJob: jest.fn(),
      saveJob: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<JobModal jobId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(500);
  });
}); 