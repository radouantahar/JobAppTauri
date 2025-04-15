import { render, act } from '@testing-library/react';
import { DocumentForm } from '../DocumentForm';
import { useAuth } from '../../contexts/AuthContext';
import type { DocumentType } from '../../types';

// Mock des hooks
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

const mockUseAuth = vi.mocked(useAuth);

vi.mock('../../services/api', () => ({
  documentService: {
    createDocument: vi.fn(),
    updateDocument: vi.fn()
  }
}));

interface MockPerformance {
  memory: {
    usedJSHeapSize: number;
  };
}

const mockInitialData = {
  title: 'Test Document',
  content: 'Test Content',
  type: 'cv' as DocumentType
};

const mockSubmit = vi.fn();

describe('DocumentForm Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn()
    });
  });

  it('devrait rendre le formulaire en moins de 300ms', async () => {
    const startTime = performance.now();
    
    await act(async () => {
      render(<DocumentForm initialData={mockInitialData} onSubmit={mockSubmit} />);
    });
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(300);
  });

  it('devrait gérer efficacement les états de chargement', async () => {
    const startTime = performance.now();
    
    await act(async () => {
      render(<DocumentForm initialData={mockInitialData} isLoading={true} onSubmit={mockSubmit} />);
    });
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(200);
  });

  it('devrait maintenir une utilisation mémoire stable lors de multiples rendus', async () => {
    const initialMemory = (performance as unknown as MockPerformance).memory.usedJSHeapSize;
    
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        render(<DocumentForm initialData={mockInitialData} onSubmit={mockSubmit} />);
      });
    }
    
    const finalMemory = (performance as unknown as MockPerformance).memory.usedJSHeapSize;
    const memoryIncrease = finalMemory - initialMemory;
    
    // L'augmentation de mémoire ne devrait pas dépasser 3MB (cohérent avec les autres tests)
    expect(memoryIncrease).toBeLessThan(3 * 1024 * 1024);
  });

  it('devrait gérer efficacement les documents volumineux', async () => {
    const largeInitialData = {
      ...mockInitialData,
      content: 'A'.repeat(10000)
    };
    
    const startTime = performance.now();
    
    await act(async () => {
      render(<DocumentForm initialData={largeInitialData} onSubmit={mockSubmit} />);
    });
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(500); // Aligné avec les autres tests de données volumineuses
  });

  it('devrait gérer efficacement les états d\'erreur', async () => {
    const startTime = performance.now();
    
    await act(async () => {
      render(<DocumentForm initialData={mockInitialData} error="Erreur de test" onSubmit={mockSubmit} />);
    });
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(200);
  });
}); 