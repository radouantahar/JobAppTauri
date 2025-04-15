import { useState, useCallback, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { jobService } from '../services/api';
import type { Job, JobType, ExperienceLevel, SearchCriteria } from '../types';
import type { DatePostedOption } from '../components/search/SearchFilters';

interface SearchResponse {
  jobs: Job[];
  total: number;
}

export function useJobSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 500);
  const [jobType, setJobType] = useState<JobType | null>(null);
  const [location, setLocation] = useState('');
  const [experienceLevels, setExperienceLevels] = useState<ExperienceLevel[]>([]);
  const [salaryMin, setSalaryMin] = useState<number | ''>('');
  const [datePosted, setDatePosted] = useState<DatePostedOption>('any');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const searchCriteria = useMemo<SearchCriteria>(() => ({
    keywords: debouncedSearch ? debouncedSearch.split(' ') : [],
    jobType: jobType ? [jobType] : undefined,
    location: location || undefined,
    experienceLevels: experienceLevels.length > 0 ? experienceLevels : undefined,
    salaryMin: salaryMin ? Number(salaryMin) : undefined,
    datePosted,
    page,
  }), [debouncedSearch, jobType, location, experienceLevels, salaryMin, datePosted, page]);

  const loadJobs = useCallback(async (reset = false) => {
    if (reset) {
      setPage(1);
      setJobs([]);
    }
    
    setError(null);
    try {
      const results = await jobService.searchJobs(searchCriteria);
      const response = Array.isArray(results) ? { jobs: results, total: results.length } : results as SearchResponse;
      
      setJobs(prev => reset ? response.jobs : [...prev, ...response.jobs]);
      setTotalResults(response.total);
      setHasMore(response.jobs.length === 10);
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError('Une erreur est survenue lors de la recherche');
    } finally {
      setIsLoadingMore(false);
    }
  }, [searchCriteria]);

  return {
    searchQuery,
    setSearchQuery,
    jobType,
    setJobType,
    location,
    setLocation,
    experienceLevels,
    setExperienceLevels,
    salaryMin,
    setSalaryMin,
    datePosted,
    setDatePosted,
    jobs,
    error,
    totalResults,
    hasMore,
    isLoadingMore,
    setIsLoadingMore,
    loadJobs,
    setPage,
  };
} 