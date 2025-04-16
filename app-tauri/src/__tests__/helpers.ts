import type { Job, JobSource, JobType, ExperienceLevel, ISODateString, CommuteTime } from '../types';

export const createMockJob = (overrides: Partial<Job> = {}): Job => ({
  id: '1',
  title: 'Développeur Full Stack',
  company: 'Tech Corp',
  location: 'Paris',
  description: 'Description du poste',
  url: 'https://example.com/job/1',
  source: 'linkedin' as JobSource,
  publishedAt: '2024-01-01T00:00:00Z' as ISODateString,
  jobType: 'full-time' as JobType,
  experienceLevel: 'mid' as ExperienceLevel,
  salary: {
    min: 40000,
    max: 60000,
    currency: 'EUR',
    period: 'year'
  },
  matchingScore: 85,
  skills: ['React', 'Node.js', 'TypeScript'],
  commuteTimes: {
    primaryHome: {
      duration: 30,
      distance: 5,
      mode: 'transit'
    } as CommuteTime
  },
  remote: false,
  contractType: 'CDI',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides
}); 