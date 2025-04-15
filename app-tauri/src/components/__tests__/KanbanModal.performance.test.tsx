import { render, act } from '@testing-library/react';
import { KanbanModal } from 'components/KanbanModal';
import { useAuth } from 'contexts/AuthContext';
import { useKanban } from 'hooks/useKanban';

// Mock des hooks
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useKanban');

const mockUseAuth = useAuth as jest.Mock;
const mockUseKanban = useKanban as jest.Mock;

describe('KanbanModal Performance Tests', () => {
  const mockCard = {
    id: '1',
    title: 'Candidature React Developer',
    description: 'Description de la candidature',
    status: 'applied',
    jobId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: 'Notes sur la candidature',
    interviews: [
      {
        date: new Date().toISOString(),
        type: 'phone',
        notes: 'Notes sur l\'entretien',
      },
    ],
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
      updateCard: jest.fn(),
      deleteCard: jest.fn(),
      moveCard: jest.fn(),
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
      updateCard: jest.fn(),
      deleteCard: jest.fn(),
      moveCard: jest.fn(),
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
      updateCard: jest.fn(),
      deleteCard: jest.fn(),
      moveCard: jest.fn(),
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

  it('devrait gérer efficacement les cartes avec beaucoup d\'entretiens', () => {
    const cardWithManyInterviews = {
      ...mockCard,
      interviews: Array(50).fill(null).map((_, i) => ({
        date: new Date().toISOString(),
        type: i % 2 === 0 ? 'phone' : 'onsite',
        notes: `Notes sur l'entretien ${i + 1}`,
      })),
    };

    mockUseKanban.mockReturnValue({
      card: cardWithManyInterviews,
      isLoading: false,
      error: null,
      updateCard: jest.fn(),
      deleteCard: jest.fn(),
      moveCard: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<KanbanModal cardId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(500);
  });
}); 