import { Job, ExperienceLevel, CommuteMode, JobSource } from '../../types/job';

export const createMockJob = (overrides: Partial<Job> = {}): Job => ({
  id: '1',
  title: 'Développeur Full Stack',
  company: 'Tech Corp',
  location: 'Paris',
  type: 'CDI',
  postedAt: '2024-01-01',
  experienceLevel: 'mid',
  salary: {
    min: 45000,
    max: 60000,
    currency: 'EUR',
    period: 'year'
  },
  description: 'Description du poste',
  url: 'https://example.com/job',
  remote: true,
  skills: ['React', 'Node.js', 'TypeScript'],
  jobType: 'CDI',
  commuteTimes: [{
    mode: 'transit' as CommuteMode,
    duration: 30,
    distance: 5
  }],
  source: 'linkedin',
  ...overrides
}); 