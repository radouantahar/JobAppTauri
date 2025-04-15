import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store';
import type { Job } from '../types';

export const usePreloadData = () => {
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [preloadError, setPreloadError] = useState<Error | null>(null);
  const { setJobs } = useAppStore();

  const preloadJobs = useCallback(async () => {
    try {
      const jobs = await invoke<Job[]>('get_jobs');
      setJobs(jobs);
      setPreloadProgress(100);
    } catch (error) {
      setPreloadError(error instanceof Error ? error : new Error('Failed to preload jobs'));
    }
  }, [setJobs]);

  useEffect(() => {
    preloadJobs();
  }, [preloadJobs]);

  return { preloadProgress, preloadError };
}; 