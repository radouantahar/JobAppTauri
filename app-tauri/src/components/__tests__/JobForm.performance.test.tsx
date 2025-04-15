import { render, act } from '@testing-library/react';
import { vi } from 'vitest';
import { JobForm } from '@/components/JobForm';
import type { Job, JobType, ExperienceLevel, SalaryRange } from '@/types';

vi.mock('@mantine/core', () => ({
  Stack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TextInput: ({ value, onChange }: any) => <input value={value} onChange={onChange} />,
  Textarea: ({ value, onChange }: any) => <textarea value={value} onChange={onChange} />,
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  Group: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NumberInput: ({ value, onChange }: any) => <input type="number" value={value} onChange={onChange} />,
  Select: ({ value, onChange }: any) => <select value={value} onChange={onChange} />
}));

const mockJob: Partial<Job> = {
  title: 'Développeur React',
  company: 'TechCorp',
  location: 'Paris',
  description: 'Description du poste',
  url: 'https://example.com/job',
  jobType: 'full-time' as JobType,
  experienceLevel: 'mid' as ExperienceLevel,
  salary: {
    min: 45000,
    max: 55000,
    currency: 'EUR',
    period: 'year'
  } as SalaryRange,
  skills: ['React', 'TypeScript']
};

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
      render(<JobForm onSubmit={mockSubmit} isLoading={true} />);
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
    const jobWithManyFields = {
      ...mockJob,
      description: 'Description très longue'.repeat(100),
      skills: Array(50).fill('').map((_, i) => `Skill ${i}`)
    };

    const startTime = performance.now();
    
    act(() => {
      render(<JobForm initialData={jobWithManyFields} onSubmit={mockSubmit} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(500);
  });
}); 