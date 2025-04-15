import { useState, useCallback } from 'react';
import { jobService } from '../services/api';
import type { Job, SearchCriteria } from '../types';

export const useJobSearch = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const search = useCallback(async (criteria: SearchCriteria) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await jobService.searchJobs(criteria);
      setJobs(response);
      setTotalResults(response.length);
      setHasMore(response.length === 10);
    } catch (err) {
      console.error('Error searching jobs:', err);
      setError('Erreur lors de la recherche');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    jobs,
    isLoading,
    error,
    totalResults,
    hasMore,
    search
  };
}; 