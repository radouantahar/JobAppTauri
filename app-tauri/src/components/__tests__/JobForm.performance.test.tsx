import React from 'react';
import { render, act } from '@testing-library/react';
import { JobForm } from '../JobForm';
import { useAuth } from '../../contexts/AuthContext';
import { useJob } from '../../hooks/useJob';

// Mock des hooks
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useJob');

const mockUseAuth = useAuth as jest.Mock;
const mockUseJob = useJob as jest.Mock;

describe('JobForm Performance Tests', () => {
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
      createJob: jest.fn(),
      updateJob: jest.fn(),
    });
  });

  it('devrait rendre le formulaire en moins de 300ms', () => {
    const startTime = performance.now();
    
    act(() => {
      render(<JobForm jobId="1" onClose={() => {}} />);
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
      createJob: jest.fn(),
      updateJob: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<JobForm jobId="1" onClose={() => {}} />);
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
      createJob: jest.fn(),
      updateJob: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<JobForm jobId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(200);
  });

  it('devrait maintenir une utilisation mémoire stable lors de multiples rendus', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    const memorySamples: number[] = [];

    for (let i = 0; i < 10; i++) {
      act(() => {
        render(<JobForm jobId="1" onClose={() => {}} />);
      });

      if (performance.memory) {
        memorySamples.push(performance.memory.usedJSHeapSize);
      }
    }

    if (memorySamples.length > 0) {
      const maxMemoryIncrease = Math.max(...memorySamples) - initialMemory;
      expect(maxMemoryIncrease).toBeLessThan(3 * 1024 * 1024); // Moins de 3MB d'augmentation
    }
  });

  it('devrait gérer efficacement les formulaires avec beaucoup de champs', () => {
    const jobWithManyFields = {
      ...mockJob,
      description: 'Description très longue'.repeat(100),
      skills: Array(50).fill('').map((_, i) => `Skill ${i}`),
      requirements: Array(50).fill('').map((_, i) => `Requirement ${i}`),
      benefits: Array(50).fill('').map((_, i) => `Benefit ${i}`),
    };

    mockUseJob.mockReturnValue({
      job: jobWithManyFields,
      isLoading: false,
      error: null,
      createJob: jest.fn(),
      updateJob: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<JobForm jobId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(500);
  });
}); 