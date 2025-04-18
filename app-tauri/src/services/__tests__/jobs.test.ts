/// <reference types="vitest/globals" />
import { invoke } from '@tauri-apps/api/core';
import { jobService } from '../api';
import type { ISODateString, JobType, CommuteTime } from '../../types';
import type { SearchCriteria } from '../../types/search';
import { createMockJobs } from '../../__tests__/fixtures/jobs';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@tauri-apps/api/core');

const mockJobs = createMockJobs(10);

describe('JobService', () => {
  const mockJob = {
    id: '1',
    title: 'Développeur Full Stack',
    company: 'Tech Corp',
    location: 'Paris',
    type: 'CDI' as JobType,
    postedAt: '2024-03-20T00:00:00.000Z' as ISODateString,
    experienceLevel: 'mid',
    salary: {
      min: 40000,
      max: 60000,
      currency: 'EUR',
      period: 'year'
    },
    description: 'Description du poste',
    url: 'https://example.com/job',
    remote: true,
    skills: ['React', 'Node.js'],
    jobType: 'CDI' as JobType,
    commuteTimes: [] as CommuteTime[],
    source: 'linkedin'
  };

  it('should fetch jobs', async () => {
    const mockResponse = {
      data: [mockJob],
      success: true
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse)
    });

    const result = await jobService.searchJobs({
      keywords: [''],
      location: ''
    } as SearchCriteria);
    expect(result).toEqual(mockResponse);
  });

  test('should search jobs', async () => {
    const mockJobs = [mockJob];
    vi.mocked(invoke).mockResolvedValue(mockJobs);

    const searchCriteria: SearchCriteria = {
      keywords: [''],
      location: 'Paris',
      jobTypes: ['full-time'],
      experienceLevels: ['mid'],
      salaryMin: 40000,
      salaryMax: 60000,
      remote: false
    };

    const result = await jobService.searchJobs(searchCriteria);
    expect(result).toEqual(mockJobs);
    expect(invoke).toHaveBeenCalledWith('search_jobs', { criteria: searchCriteria });
  });

  test('should get job details', async () => {
    vi.mocked(invoke).mockResolvedValue(mockJob);

    const result = await jobService.getJobDetails(1);
    expect(result).toEqual(mockJob);
    expect(invoke).toHaveBeenCalledWith('get_job_details', { jobId: 1 });
  });

  test('should calculate matching score', async () => {
    vi.mocked(invoke).mockResolvedValue(0.85);

    const result = await jobService.calculateMatchingScore(1);
    expect(result).toBe(0.85);
    expect(invoke).toHaveBeenCalledWith('calculate_matching_score', { jobId: 1 });
  });

  test('should calculate commute times', async () => {
    const mockCommuteTimes: CommuteTime[] = [{
      duration: 30,
      distance: 5,
      mode: 'transit'
    }, {
      duration: 45,
      distance: 8,
      mode: 'driving'
    }, {
      duration: 60,
      distance: 10,
      mode: 'transit'
    }, {
      duration: 90,
      distance: 15,
      mode: 'driving'
    }];
    vi.mocked(invoke).mockResolvedValue(mockCommuteTimes);

    const result = await jobService.calculateCommuteTimes(1);
    expect(result).toEqual(mockCommuteTimes);
    expect(invoke).toHaveBeenCalledWith('calculate_commute_times', { jobId: 1 });
  });

  test('should detect duplicates', async () => {
    const mockDuplicates = [2, 3];
    vi.mocked(invoke).mockResolvedValue(mockDuplicates);

    const result = await jobService.detectDuplicates(1);
    expect(result).toEqual(mockDuplicates);
    expect(invoke).toHaveBeenCalledWith('detect_duplicates', { jobId: 1 });
  });

  test('should search jobs with filters', async () => {
    vi.mocked(invoke).mockResolvedValue(mockJobs);
    const filters: SearchCriteria = {
      keywords: [''],
      location: '',
      jobTypes: [],
      experienceLevels: [],
      salaryMin: undefined,
      salaryMax: undefined,
      remote: undefined
    };
    const result = await jobService.searchJobs(filters);
    expect(result).toEqual(mockJobs);
  });
});

describe('jobService', () => {
  // Tests...
}); 