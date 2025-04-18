import { Job } from '../types/job';

export async function getJobDetails(id: string, invoke: (cmd: string, args?: any) => Promise<any>): Promise<Job> {
  try {
    const job = await invoke('get_job', { id });
    return job;
  } catch (error) {
    throw new Error('Failed to get job details');
  }
} 