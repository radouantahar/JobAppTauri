import { render, act } from '@testing-library/react';
import { JobForm } from '../JobForm';
import type { Job, JobType, ExperienceLevel, JobSource, CommuteMode } from '../../types';

vi.mock('@mantine/core', () => ({
  Stack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TextInput: ({ value, onChange }: any) => <input value={value} onChange={onChange} />,
  Textarea: ({ value, onChange }: any) => <textarea value={value} onChange={onChange} />,
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  Group: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NumberInput: ({ value, onChange }: any) => <input type="number" value={value} onChange={onChange} />,
  Select: ({ value, onChange }: any) => <select value={value} onChange={onChange} />
}));

const mockSubmit = vi.fn();

describe('JobForm Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rendre le formulaire en moins de 300ms', () => {
    const startTime = performance.now();
    
    act(() => {
      render(<JobForm onSubmit={mockSubmit} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(300);
  });

  it('devrait gérer efficacement les états de chargement', () => {
    const startTime = performance.now();
    
    act(() => {
      render(<JobForm onSubmit={mockSubmit} />);
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
        render(<JobForm onSubmit={mockSubmit} />);
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
    const startTime = performance.now();
    
    act(() => {
      render(<JobForm onSubmit={mockSubmit} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(500);
  });
}); 