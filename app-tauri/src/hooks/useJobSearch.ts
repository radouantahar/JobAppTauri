import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import type { Job, SearchFilters } from '../types';

interface UseJobSearchResult {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  search: (filters: SearchFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  clearResults: () => void;
  saveJob: (job: Job) => Promise<void>;
}

export const useJobSearch = (): UseJobSearchResult => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const search = async (filters: SearchFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await invoke<Job[]>('search_jobs', { filters });
      setJobs(results);
      setHasMore(results.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const moreResults = await invoke<Job[]>('load_more_jobs');
      setJobs(prev => [...prev, ...moreResults]);
      setHasMore(moreResults.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setJobs([]);
    setError(null);
    setHasMore(true);
  };

  const saveJob = async (job: Job) => {
    try {
      await invoke('save_job', { job });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la sauvegarde');
    }
  };

  return {
    jobs,
    isLoading,
    error,
    hasMore,
    search,
    loadMore,
    clearResults,
    saveJob,
  };
}; 