import { useState, useCallback, useRef, useEffect } from 'react';
import { jobService } from '../services/api';
import type { Job, SearchCriteria } from '../types';

interface SearchState {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  totalResults: number;
  retryCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 seconde

export const useJobSearch = () => {
  const [state, setState] = useState<SearchState>({
    jobs: [],
    isLoading: false,
    error: null,
    hasMore: true,
    page: 1,
    totalResults: 0,
    retryCount: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Nettoyage des références lors du démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const search = useCallback(async (criteria: SearchCriteria) => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau contrôleur pour la nouvelle requête
    abortControllerRef.current = new AbortController();

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      retryCount: 0
    }));

    const performSearch = async (retryCount: number = 0): Promise<void> => {
      try {
        console.log(`Recherche en cours (page ${criteria.page}, tentative ${retryCount + 1})`);
        const jobs = await jobService.searchJobs(criteria);

        setState(prev => ({
          ...prev,
          jobs: criteria.page === 1 ? jobs : [...prev.jobs, ...jobs],
          isLoading: false,
          hasMore: jobs.length === 10,
          page: criteria.page || 1,
          totalResults: jobs.length,
          retryCount: 0
        }));

        console.log(`Recherche réussie: ${jobs.length} résultats trouvés`);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Recherche annulée');
          return;
        }

        console.error('Erreur lors de la recherche:', err);
        
        if (retryCount < MAX_RETRIES) {
          console.log(`Nouvelle tentative dans ${RETRY_DELAY}ms (${retryCount + 1}/${MAX_RETRIES})`);
          retryTimeoutRef.current = setTimeout(() => {
            performSearch(retryCount + 1);
          }, RETRY_DELAY);
        } else {
          setState(prev => ({
            ...prev,
            error: 'Erreur lors de la recherche. Veuillez réessayer.',
            isLoading: false,
            retryCount: retryCount
          }));
        }
      }
    };

    await performSearch();
  }, []);

  const loadMore = useCallback(() => {
    if (!state.isLoading && state.hasMore) {
      const nextPage = state.page + 1;
      search({ ...state, page: nextPage });
    }
  }, [state, search]);

  const resetSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    setState({
      jobs: [],
      isLoading: false,
      error: null,
      hasMore: true,
      page: 1,
      totalResults: 0,
      retryCount: 0
    });
  }, []);

  return {
    jobs: state.jobs,
    isLoading: state.isLoading,
    error: state.error,
    hasMore: state.hasMore,
    totalResults: state.totalResults,
    retryCount: state.retryCount,
    search,
    loadMore,
    resetSearch
  };
}; 