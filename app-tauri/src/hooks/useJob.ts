import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Job } from '../types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 seconde

export const useJob = (jobId: string) => {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchJob = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await invoke('get_job', { jobId });
      setJob(result as Job);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        await sleep(RETRY_DELAY);
        await fetchJob();
      } else {
        setError(err instanceof Error ? err : new Error('Erreur lors du chargement'));
        setRetryCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [jobId, retryCount]);

  const createJob = useCallback(async (jobData: Partial<Job>) => {
    try {
      setIsLoading(true);
      const result = await invoke('create_job', { job: jobData });
      setJob(result as Job);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la création'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateJob = useCallback(async (updates: Partial<Job>) => {
    try {
      setIsLoading(true);
      const result = await invoke('update_job', { jobId, updates });
      setJob(result as Job);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la mise à jour'));
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  const applyToJob = useCallback(async () => {
    try {
      setIsLoading(true);
      await invoke('apply_to_job', { jobId });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la candidature'));
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  const saveJob = useCallback(async () => {
    try {
      setIsLoading(true);
      await invoke('save_job', { jobId });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la sauvegarde'));
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId, fetchJob]);

  return { 
    job, 
    isLoading, 
    error, 
    retryCount,
    applyToJob, 
    saveJob, 
    createJob, 
    updateJob,
    refetch: fetchJob
  };
}; 