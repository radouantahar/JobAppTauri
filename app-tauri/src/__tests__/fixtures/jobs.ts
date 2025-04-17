import { createMockJob } from '../helpers';
import type { Job } from '../../types';

export const createMockJobs = (count: number, overrides: Partial<Job> = {}): Job[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockJob({ 
      id: String(i + 1),
      ...overrides 
    })
  );
}; 