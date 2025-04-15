import type { Job, JobType, ExperienceLevel } from '../../types';
import { DatePostedOption } from '../../components/search/SearchFilters';

export interface SearchResponse {
  jobs: Job[];
  total: number;
}

export interface SearchState {
  searchQuery: string;
  jobType: JobType | null;
  location: string;
  experienceLevels: ExperienceLevel[];
  salaryMin: number | '';
  datePosted: DatePostedOption;
  jobs: Job[];
  error: string | null;
  totalResults: number;
  page: number;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export interface SearchActions {
  setSearchQuery: (query: string) => void;
  setJobType: (type: JobType | null) => void;
  setLocation: (location: string) => void;
  setExperienceLevels: (levels: ExperienceLevel[]) => void;
  setSalaryMin: (min: number | '') => void;
  setDatePosted: (date: DatePostedOption) => void;
  setJobs: (jobs: Job[]) => void;
  setError: (error: string | null) => void;
  setTotalResults: (total: number) => void;
  setPage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;
  setIsLoadingMore: (loading: boolean) => void;
}

export const INITIAL_SEARCH_STATE: SearchState = {
  searchQuery: '',
  jobType: null,
  location: '',
  experienceLevels: [],
  salaryMin: '',
  datePosted: 'any',
  jobs: [],
  error: null,
  totalResults: 0,
  page: 1,
  hasMore: true,
  isLoadingMore: false,
}; 