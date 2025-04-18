import type { Job, JobSource, JobType, ExperienceLevel, CommuteTime } from '../../types';

export const createMockJobs = (count: number): Job[] => {
  return Array(count).fill(null).map((_, index) => ({
    id: `job-${index}`,
    title: `Job ${index}`,
    company: `Company ${index}`,
    location: `Location ${index}`,
    type: 'CDI',
    description: `Description for job ${index}`,
    url: `https://example.com/job-${index}`,
    source: 'linkedin' as JobSource,
    postedAt: new Date().toISOString(),
    jobType: 'CDI' as JobType,
    experienceLevel: 'mid' as ExperienceLevel,
    experience: 'mid' as ExperienceLevel,
    salary: {
      min: 30000 + index * 1000,
      max: 50000 + index * 1000,
      currency: 'EUR',
      period: 'year'
    },
    skills: ['React', 'TypeScript'],
    commuteTimes: [] as CommuteTime[],
    remote: false
  }));
}; 