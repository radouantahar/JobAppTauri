import type { Job } from '../../../types/job';

export const createMockJob = (overrides: Partial<Job> = {}): Job => ({
  id: '1',
  title: 'Test Job',
  company: 'Test Company',
  location: 'Paris',
  type: 'CDI',
  url: 'https://example.com',
  description: 'Test description',
  salary: {
    min: 40000,
    max: 60000,
    currency: 'EUR',
    period: 'year'
  },
  jobType: 'CDI',
  experienceLevel: 'mid',
  publishedAt: new Date().toISOString(),
  postedAt: new Date().toISOString(),
  skills: ['React', 'TypeScript'],
  ...overrides
}); 