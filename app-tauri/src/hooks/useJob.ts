import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  matchingScore?: number;
  skills?: string[];
  experienceLevel?: string;
  commuteTimes?: Record<string, {
    duration: number;
    distance: number;
    mode: string;
  }>;
}

export const useJob = (jobId: string) => {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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

  return { job, isLoading, error, applyToJob, saveJob };
}; 