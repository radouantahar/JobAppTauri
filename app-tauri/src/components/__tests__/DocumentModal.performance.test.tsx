import { render, act } from '@testing-library/react';
import { DocumentModal } from '../DocumentModal';
import { useAuth } from '../../contexts/AuthContext';
import { useDocument } from '../../hooks/useDocument';
import type { Document } from '../../types';
import { createISODateString } from '../../types';

// Mock des hooks
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../hooks/useDocument', () => ({
  useDocument: vi.fn()
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseDocument = vi.mocked(useDocument);

const mockDocument: Document = {
  id: '1',
  title: 'Test Document',
  description: 'Test Description',
  content: 'Test Content',
  type: 'cv',
  createdAt: createISODateString('2024-04-15T00:00:00.000Z'),
  updatedAt: createISODateString('2024-04-15T00:00:00.000Z'),
};

describe('DocumentModal Performance Tests', () => {
  beforeEach(() => {
    // Configuration des mocks par défaut
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    mockUseDocument.mockReturnValue({
      document: mockDocument,
      isLoading: false,
      error: null,
      updateDocument: vi.fn(),
      deleteDocument: vi.fn(),
    });
  });

  it('devrait ouvrir le modal en moins de 300ms', () => {
    const startTime = performance.now();
    
    act(() => {
      render(<DocumentModal documentId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(300);
  });

  it('devrait gérer efficacement les états de chargement', () => {
    mockUseDocument.mockReturnValue({
      document: null,
      isLoading: true,
      error: null,
      updateDocument: vi.fn(),
      deleteDocument: vi.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<DocumentModal documentId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(200);
  });

  it('devrait gérer efficacement les états d\'erreur', () => {
    mockUseDocument.mockReturnValue({
      document: null,
      isLoading: false,
      error: new Error('Erreur de chargement'),
      updateDocument: vi.fn(),
      deleteDocument: vi.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<DocumentModal documentId="1" onClose={() => {}} />);
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
        render(<DocumentModal documentId="1" onClose={() => {}} />);
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

  it('devrait gérer efficacement les documents volumineux', () => {
    const largeDocument: Document = {
      ...mockDocument,
      content: 'Contenu très long'.repeat(1000),
    };

    mockUseDocument.mockReturnValue({
      document: largeDocument,
      isLoading: false,
      error: null,
      updateDocument: vi.fn(),
      deleteDocument: vi.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<DocumentModal documentId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(500);
  });
}); 