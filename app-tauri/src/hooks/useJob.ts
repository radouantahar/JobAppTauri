import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Job } from '../types';

export const useJob = (jobId: string) => {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await invoke('get_job', { jobId });
      setJob(result as Job);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement'));
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  const createJob = useCallback(async (jobData: Partial<Job>) => {
    try {
      setIsLoading(true);
      const result = await invoke('create_job', { job: jobData });
      setJob(result as Job);
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

  return { job, isLoading, error, applyToJob, saveJob, createJob, updateJob };
}; 