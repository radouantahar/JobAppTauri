import { describe, it, expect, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { jobService } from '../api';
import type { Job, SearchCriteria, ISODateString, ExperienceLevel, JobType } from '../../types';

vi.mock('@tauri-apps/api/core');

describe('JobService', () => {
  const mockJob: Job = {
    id: '1',
    title: 'Software Engineer',
    company: 'Tech Corp',
    location: 'Paris',
    description: 'Looking for a skilled software engineer',
    url: 'https://example.com/job/1',
    source: 'linkedin',
    publishedAt: new Date().toISOString() as ISODateString,
    jobType: 'full-time' as JobType,
    experienceLevel: 'mid' as ExperienceLevel,
    salary: {
      min: 50000,
      max: 70000,
      currency: 'EUR',
      period: 'year'
    },
    matchingScore: 0.85,
    skills: ['JavaScript', 'React', 'TypeScript'],
    commuteTimes: {
      'home': {
        duration: 30,
        distance: 10,
        mode: 'driving'
      }
    }
  };

  it('should search jobs', async () => {
    const mockJobs = [mockJob];
    (invoke as jest.Mock).mockResolvedValue(mockJobs);

    const searchCriteria: SearchCriteria = {
      location: 'Paris',
      jobType: ['full-time' as JobType],
      experienceLevel: ['mid' as ExperienceLevel],
      salaryMin: 40000,
      salaryMax: 60000,
      skills: ['React', 'TypeScript'],
      remote: false
    };

    const result = await jobService.searchJobs(searchCriteria);
    expect(result).toEqual(mockJobs);
    expect(invoke).toHaveBeenCalledWith('search_jobs', { criteria: searchCriteria });
  });

  it('should get job details', async () => {
    (invoke as jest.Mock).mockResolvedValue(mockJob);

    const result = await jobService.getJobDetails(1);
    expect(result).toEqual(mockJob);
    expect(invoke).toHaveBeenCalledWith('get_job_details', { jobId: 1 });
  });

  it('should calculate matching score', async () => {
    (invoke as jest.Mock).mockResolvedValue(0.85);

    const result = await jobService.calculateMatchingScore(1);
    expect(result).toBe(0.85);
    expect(invoke).toHaveBeenCalledWith('calculate_matching_score', { jobId: 1 });
  });

  it('should calculate commute times', async () => {
    const mockCommuteTimes = {
      'home': {
        duration: 30,
        distance: 10,
        mode: 'driving'
      }
    };
    (invoke as jest.Mock).mockResolvedValue(mockCommuteTimes);

    const result = await jobService.calculateCommuteTimes(1);
    expect(result).toEqual(mockCommuteTimes);
    expect(invoke).toHaveBeenCalledWith('calculate_commute_times', { jobId: 1 });
  });

  it('should detect duplicates', async () => {
    const mockDuplicates = [2, 3];
    (invoke as jest.Mock).mockResolvedValue(mockDuplicates);

    const result = await jobService.detectDuplicates(1);
    expect(result).toEqual(mockDuplicates);
    expect(invoke).toHaveBeenCalledWith('detect_duplicates', { jobId: 1 });
  });
}); 