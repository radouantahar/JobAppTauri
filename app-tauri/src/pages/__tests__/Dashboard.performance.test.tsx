import { render, act } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { useAuth } from '../../contexts/AuthContext';
import { useJobStats } from '../../hooks/useJobStats';
import { useApplicationStats } from '../../hooks/useApplicationStats';

// Mock des hooks
vi.mock('../../contexts/AuthContext');
vi.mock('../../hooks/useJobStats');
vi.mock('../../hooks/useApplicationStats');

const mockUseAuth = useAuth as jest.Mock;
const mockUseJobStats = useJobStats as jest.Mock;
const mockUseApplicationStats = useApplicationStats as jest.Mock;

describe('DashboardPage Performance Tests', () => {
  beforeEach(() => {
    // Configuration des mocks par défaut
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    mockUseJobStats.mockReturnValue({
      stats: {
        total: 100,
        byType: {
          'full-time': 50,
          'part-time': 30,
          'contract': 20,
        },
        bySource: {
          'indeed': 60,
          'linkedin': 40,
        },
      },
      isLoading: false,
      error: null,
    });

    mockUseApplicationStats.mockReturnValue({
      stats: {
        total: 50,
        byStatus: {
          'applied': 20,
          'interview': 15,
          'offer': 10,
          'rejected': 5,
        },
        averageResponseTime: 3,
      },
      isLoading: false,
      error: null,
    });
  });

  it('should render dashboard with stats in less than 500ms', () => {
    const startTime = performance.now();
    
    act(() => {
      render(<Dashboard />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(500);
  });

  it('should handle loading states efficiently', () => {
    mockUseJobStats.mockReturnValue({
      stats: null,
      isLoading: true,
      error: null,
    });

    mockUseApplicationStats.mockReturnValue({
      stats: null,
      isLoading: true,
      error: null,
    });

    const startTime = performance.now();
    
    act(() => {
      render(<Dashboard />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(300);
  });

  it('should handle error states efficiently', () => {
    mockUseJobStats.mockReturnValue({
      stats: null,
      isLoading: false,
      error: new Error('Test error'),
    });

    mockUseApplicationStats.mockReturnValue({
      stats: null,
      isLoading: false,
      error: new Error('Test error'),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<Dashboard />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(300);
  });

  it('should maintain stable memory usage during multiple renders', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    const memorySamples: number[] = [];

    for (let i = 0; i < 10; i++) {
      act(() => {
        render(<Dashboard />);
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

  it('should handle large datasets efficiently', () => {
    mockUseJobStats.mockReturnValue({
      stats: {
        total: 1000,
        byType: {
          'full-time': 500,
          'part-time': 300,
          'contract': 200,
        },
        bySource: {
          'indeed': 600,
          'linkedin': 400,
        },
      },
      isLoading: false,
      error: null,
    });

    mockUseApplicationStats.mockReturnValue({
      stats: {
        total: 500,
        byStatus: {
          'applied': 200,
          'interview': 150,
          'offer': 100,
          'rejected': 50,
        },
        averageResponseTime: 3,
      },
      isLoading: false,
      error: null,
    });

    const startTime = performance.now();
    
    act(() => {
      render(<Dashboard />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(1000);
  });
}); 