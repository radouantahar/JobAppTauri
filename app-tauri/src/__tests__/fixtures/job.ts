import type { Job, ISODateString, JobType, CommuteTime } from '../../types';

const createISODateString = (date: Date): ISODateString => {
  return date.toISOString() as ISODateString;
};

export const createMockJob = (overrides: Partial<Job> = {}): Job => ({
  id: '1',
  title: 'Test Job',
  company: 'Test Company',
  location: 'Paris',
  type: 'CDI',
  postedAt: createISODateString(new Date()),
  experience: 'mid',
  salary: {
    min: 40000,
    max: 60000,
    currency: 'EUR',
    period: 'year'
  },
  description: 'Test description',
  url: 'https://example.com',
  remote: false,
  skills: ['React', 'TypeScript'],
  jobType: 'CDI' as JobType,
  experienceLevel: 'mid',
  commuteTimes: [] as CommuteTime[],
  source: 'linkedin',
  ...overrides
});

export const createMockJobs = (count: number, overrides: Partial<Job> = {}): Job[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockJob({
      id: String(i + 1),
      title: `Job ${i + 1}`,
      company: `Company ${i + 1}`,
      ...overrides
    })
  );
}; 