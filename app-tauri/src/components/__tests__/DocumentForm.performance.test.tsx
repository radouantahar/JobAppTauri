import { render, act } from '@testing-library/react';
import { DocumentForm } from '../DocumentForm';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { useAuth } from '../../contexts/AuthContext';

// Mock des hooks
vi.mock('../../contexts/AuthContext');

const mockUseAuth = useAuth as jest.Mock;

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

const mockDocument = {
  id: '1',
  title: 'Test Document',
  description: 'Test Description',
  type: 'cv' as const,
  content: 'Test Content',
  url: 'http://test.com',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01'
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

  it('should render in less than 300ms', async () => {
    const startTime = performance.now();
    
    await act(async () => {
      render(<DocumentForm initialData={mockDocument} onSubmit={mockSubmit} />);
    });
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(300);
  });

  it('should handle loading state efficiently (< 200ms)', async () => {
    const startTime = performance.now();
    
    await act(async () => {
      render(<DocumentForm initialData={mockDocument} isLoading={true} onSubmit={mockSubmit} />);
    });
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(200);
  });

  it('should maintain stable memory usage during multiple renders', async () => {
    const initialMemory = (performance as unknown as MockPerformance).memory.usedJSHeapSize;
    
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        render(<DocumentForm initialData={mockDocument} onSubmit={mockSubmit} />);
      });
    }
    
    const finalMemory = (performance as unknown as MockPerformance).memory.usedJSHeapSize;
    const memoryIncrease = finalMemory - initialMemory;
    
    // L'augmentation de mémoire ne devrait pas dépasser 5MB
    expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
  });

  it('should handle large documents efficiently (< 1000ms)', async () => {
    const largeDocument = {
      ...mockDocument,
      content: 'A'.repeat(10000)
    };
    
    const startTime = performance.now();
    
    await act(async () => {
      render(<DocumentForm initialData={largeDocument} onSubmit={mockSubmit} />);
    });
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(1000);
  });
}); 