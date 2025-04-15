import { render, act } from '@testing-library/react';
import { KanbanForm } from '../KanbanForm';
import { useAuth } from '../../contexts/AuthContext';
import { useKanban } from '../../hooks/useKanban';
import { vi } from 'vitest';

// Mock des hooks
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useKanban');

const mockUseAuth = useAuth as jest.Mock;
const mockUseKanban = useKanban as jest.Mock;

describe('KanbanForm Performance Tests', () => {
  const mockKanban = {
    id: '1',
    title: 'Processus de recrutement',
    columns: [
      {
        id: '1',
        title: 'À postuler',
        cards: [],
      },
      {
        id: '2',
        title: 'En cours',
        cards: [],
      },
      {
        id: '3',
        title: 'Entretiens',
        cards: [],
      },
      {
        id: '4',
        title: 'Offres',
        cards: [],
      },
    ],
    lastUpdated: new Date().toISOString(),
  };

  const mockSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Configuration des mocks par défaut
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    mockUseKanban.mockReturnValue({
      kanban: mockKanban,
      isLoading: false,
      error: null,
      createKanban: jest.fn(),
      updateKanban: jest.fn(),
    });
  });

  it('devrait rendre le formulaire en moins de 300ms', () => {
    const startTime = performance.now();
    
    act(() => {
      render(<KanbanForm onSubmit={mockSubmit} onCancel={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(300);
  });

  it('devrait gérer efficacement les états de chargement', () => {
    mockUseKanban.mockReturnValue({
      kanban: null,
      isLoading: true,
      error: null,
      createKanban: jest.fn(),
      updateKanban: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<KanbanForm onSubmit={mockSubmit} onCancel={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(200);
  });

  it('devrait gérer efficacement les états d\'erreur', () => {
    mockUseKanban.mockReturnValue({
      kanban: null,
      isLoading: false,
      error: new Error('Erreur de chargement'),
      createKanban: jest.fn(),
      updateKanban: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<KanbanForm onSubmit={mockSubmit} onCancel={() => {}} />);
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
        render(<KanbanForm onSubmit={mockSubmit} onCancel={() => {}} />);
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

  it('devrait gérer efficacement les tableaux avec beaucoup de cartes', () => {
    const largeKanban = {
      ...mockKanban,
      columns: mockKanban.columns.map(column => ({
        ...column,
        cards: Array(50).fill(null).map((_, index) => ({
          id: `card-${index}`,
          title: `Carte ${index + 1}`,
          description: `Description de la carte ${index + 1}`,
          dueDate: new Date().toISOString(),
          priority: 'medium',
          status: 'todo',
        })),
      })),
    };

    mockUseKanban.mockReturnValue({
      kanban: largeKanban,
      isLoading: false,
      error: null,
      createKanban: jest.fn(),
      updateKanban: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<KanbanForm onSubmit={mockSubmit} onCancel={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(500);
  });
}); 