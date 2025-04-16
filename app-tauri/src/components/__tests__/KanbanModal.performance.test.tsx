import { render, act } from '@testing-library/react';
import { KanbanModal } from '../KanbanModal';
import { useAuth } from '../../contexts/AuthContext';
import { useKanban } from '../../hooks/useKanban';
import type { KanbanCard } from '../../types';

type Mock = jest.Mock;

const mockUseAuth = useAuth as unknown as Mock;
const mockUseKanban = useKanban as unknown as Mock;

// Configuration des mocks pour les hooks
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../hooks/useKanban', () => ({
  useKanban: vi.fn()
}));

describe('KanbanModal Performance Tests', () => {
  const mockCard: KanbanCard = {
    id: '1',
    jobId: '1',
    title: 'Développeur React',
    description: 'Description du poste',
    status: 'applied',
    notes: 'Notes sur la candidature',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    interviews: [
      {
        id: '1',
        date: new Date().toISOString(),
        type: 'phone',
        notes: 'Notes sur l\'entretien'
      }
    ]
  };

  beforeEach(() => {
    // Configuration des mocks par défaut
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    mockUseKanban.mockReturnValue({
      card: mockCard,
      isLoading: false,
      error: null,
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
    });
  });

  it('devrait ouvrir le modal en moins de 300ms', () => {
    const startTime = performance.now();
    
    act(() => {
      render(<KanbanModal cardId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(300);
  });

  it('devrait gérer efficacement les états de chargement', () => {
    mockUseKanban.mockReturnValue({
      card: null,
      isLoading: true,
      error: null,
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<KanbanModal cardId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(200);
  });

  it('devrait gérer efficacement les états d\'erreur', () => {
    mockUseKanban.mockReturnValue({
      card: null,
      isLoading: false,
      error: new Error('Erreur de chargement'),
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<KanbanModal cardId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(200);
  });

  it('devrait maintenir une utilisation mémoire stable lors de multiples ouvertures/fermetures', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    const memorySamples: number[] = [];

    for (let i = 0; i < 10; i++) {
      act(() => {
        render(<KanbanModal cardId="1" onClose={() => {}} />);
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

  it('devrait gérer efficacement les cartes avec beaucoup de notes', () => {
    const cardWithLongNotes: KanbanCard = {
      ...mockCard,
      notes: 'Notes très longues'.repeat(1000),
    };

    mockUseKanban.mockReturnValue({
      card: cardWithLongNotes,
      isLoading: false,
      error: null,
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<KanbanModal cardId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(500);
  });

  it('renders efficiently with large data', () => {
    const largeCard: KanbanCard = {
      ...mockCard,
      title: 'Titre très long '.repeat(50),
      description: 'Description très longue '.repeat(100),
      notes: 'Notes très longues '.repeat(200),
      interviews: Array(50).fill(null).map((_, index) => ({
        id: `interview-${index}`,
        date: new Date(Date.now() + index * 86400000).toISOString(),
        type: ['phone', 'technical', 'onsite'][index % 3],
        notes: `Notes détaillées sur l'entretien ${index + 1} `.repeat(20)
      }))
    };

    mockUseKanban.mockReturnValue({
      card: largeCard,
      isLoading: false,
      error: null,
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<KanbanModal cardId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(1000); // Moins d'une seconde pour un rendu avec beaucoup de données
  });
}); 