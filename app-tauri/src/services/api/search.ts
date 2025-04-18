import type { Job } from '../../types/job';

export interface SearchParams {
  query?: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  remote?: boolean;
}

export const searchJobs = async (params: SearchParams): Promise<Job[]> => {
  try {
    const response = await window.invoke('search_jobs', params);
    return response;
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
}; 