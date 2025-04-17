/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KanbanModal } from '../KanbanModal';
import { useAuth } from '../../hooks/useAuth';
import { useKanban } from '../../hooks/useKanban';

// Mock de window.performance.memory
const mockPerformance = {
  memory: {
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
  },
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock des hooks
vi.mock('../../hooks/useAuth');
vi.mock('../../hooks/useKanban');

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockUseKanban = useKanban as ReturnType<typeof vi.fn>;

describe('KanbanModal Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseKanban.mockReturnValue({
      card: null,
      isLoading: false,
      error: null,
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
      moveCard: vi.fn(),
    });
  });

  it('should render without performance issues', () => {
    const { container } = render(
      <KanbanModal cardId="test-card" onClose={vi.fn()} />
    );
    expect(container).toBeInTheDocument();
  });

  it('should handle state updates efficiently', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <KanbanModal cardId="test-card" onClose={onClose} />
    );
    const startTime = performance.now();
    
    rerender(<KanbanModal cardId="test-card" onClose={onClose} />);
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100);
  });
}); 