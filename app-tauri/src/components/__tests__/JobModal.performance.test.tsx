import { render, screen } from '@testing-library/react';
import { JobModal } from '../JobModal';
import { createMockJob } from '../../__tests__/helpers';

vi.mock('../../hooks/useJob', () => ({
  useJob: () => ({
    job: createMockJob(),
    isLoading: false,
    error: null,
    applyToJob: vi.fn(),
    saveJob: vi.fn()
  })
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true
  })
}));

describe('JobModal Performance', () => {
  it('renders quickly with job data', () => {
    const startTime = performance.now();
    render(<JobModal jobId="1" onClose={() => {}} />);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
    expect(screen.getByText('Développeur Full Stack')).toBeInTheDocument();
  });

  it('handles multiple state updates efficiently', () => {
    const { rerender } = render(<JobModal jobId="1" onClose={() => {}} />);
    
    const startTime = performance.now();
    for (let i = 0; i < 100; i++) {
      rerender(<JobModal jobId="1" onClose={() => {}} />);
    }
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(1000); // 100 rerenders should take less than 1s
  });
}); 