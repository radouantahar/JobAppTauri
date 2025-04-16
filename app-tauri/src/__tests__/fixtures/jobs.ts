import { Job, JobSource, JobType, ExperienceLevel, SalaryRange, CommuteTime } from '../../types';

export const createMockJob = (overrides: Partial<Job> = {}): Job => ({
  id: '1',
  title: 'Développeur Full Stack',
  company: 'Tech Corp',
  location: 'Paris',
  description: 'Description du poste',
  url: 'https://example.com/job/1',
  source: 'linkedin' as JobSource,
  publishedAt: new Date().toISOString() as any,
  jobType: 'cdi' as JobType,
  experienceLevel: 'senior' as ExperienceLevel,
  salary: { min: 50000, max: 70000 } as SalaryRange,
  matchingScore: 0.85,
  skills: ['React', 'Node.js', 'TypeScript'],
  commuteTimes: {
    'Paris': 30 as CommuteTime,
    'Lyon': 45 as CommuteTime,
    'Marseille': 60 as CommuteTime,
    'Bordeaux': 90 as CommuteTime
  },
  remote: true,
  contractType: 'cdi',
  createdAt: new Date().toISOString() as any,
  ...overrides
});

export const createMockJobs = (count: number): Job[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockJob({
      id: (i + 1).toString(),
      title: `Job ${i + 1}`,
      company: `Company ${i + 1}`,
      location: `Location ${i + 1}`,
      matchingScore: Math.random()
    })
  );
}; 