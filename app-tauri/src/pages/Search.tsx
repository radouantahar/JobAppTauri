// pages/Search.tsx
import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { Container, TextInput, Button, Stack, Text, Notification } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useAppStore } from '../store';
import { jobService } from '../services/api';
import type { Job, SearchCriteria, JobType, ExperienceLevel } from '../types';
import { useDebouncedValue, useInViewport } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import { SearchFilters, DatePostedOption } from '../components/search/SearchFilters';
import { SearchResults } from '../components/search/SearchResults';
import { SearchState, SearchActions, SearchResponse, INITIAL_SEARCH_STATE } from './search/types';

/**
 * Composant d'affichage des erreurs avec possibilité de réessayer
 * Utilise memo pour éviter les re-renders inutiles
 */
const ErrorDisplay = memo(function ErrorDisplay({ 
  error, 
  onRetry 
}: { 
  error: string; 
  onRetry: () => void; 
}) {
  return (
    <Container>
      <Notification
        icon={<IconX size={18} />}
        color="red"
        title="Erreur"
        withCloseButton
        onClose={() => onRetry()}
      >
        {error}
      </Notification>
      <Button 
        mt="md" 
        onClick={onRetry}
        leftSection={<IconSearch size={16} />}
      >
        Réessayer
      </Button>
    </Container>
  );
});

/**
 * Barre de recherche avec debounce intégré
 * Utilise memo pour optimiser les performances lors de la saisie
 */
const SearchBar = memo(function SearchBar({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void; 
}) {
  return (
    <TextInput
      placeholder="Rechercher des offres..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      leftSection={<IconSearch size={16} />}
      aria-label="Recherche d'offres"
    />
  );
});

/**
 * Page principale de recherche d'emplois
 * Gère l'état de recherche, la pagination infinie et l'authentification
 */
export const SearchPage = memo(function SearchPage() {
  const { setLoading, isAuthenticated } = useAppStore();
  const navigate = useNavigate();
  
  // État global de la recherche avec initialisation par défaut
  const [state, setState] = useState<SearchState>(INITIAL_SEARCH_STATE);
  // Reason: Utilisation de debounce pour éviter trop d'appels API pendant la saisie
  const [debouncedSearch] = useDebouncedValue(state.searchQuery, 500);
  // Reason: Détection de l'intersection pour le chargement infini
  const { ref: loadMoreRef, inViewport } = useInViewport();

  // Actions de mise à jour de l'état avec typage strict
  const actions: SearchActions = {
    setSearchQuery: (query: string) => setState((prev: SearchState) => ({ ...prev, searchQuery: query })),
    setJobType: (type: JobType | null) => setState((prev: SearchState) => ({ ...prev, jobType: type })),
    setLocation: (location: string) => setState((prev: SearchState) => ({ ...prev, location })),
    setExperienceLevels: (levels: ExperienceLevel[]) => setState((prev: SearchState) => ({ ...prev, experienceLevels: levels })),
    setSalaryMin: (min: number | "") => setState((prev: SearchState) => ({ ...prev, salaryMin: min })),
    setDatePosted: (date: DatePostedOption) => setState((prev: SearchState) => ({ ...prev, datePosted: date })),
    setJobs: (jobs: Job[]) => setState((prev: SearchState) => ({ ...prev, jobs })),
    setError: (error: string | null) => setState((prev: SearchState) => ({ ...prev, error })),
    setTotalResults: (total: number) => setState((prev: SearchState) => ({ ...prev, totalResults: total })),
    setPage: (page: number) => setState((prev: SearchState) => ({ ...prev, page })),
    setHasMore: (hasMore: boolean) => setState((prev: SearchState) => ({ ...prev, hasMore })),
    setIsLoadingMore: (loading: boolean) => setState((prev: SearchState) => ({ ...prev, isLoadingMore: loading })),
  };

  // Reason: Construction des critères de recherche avec valeurs optionnelles
  const searchCriteria = useMemo(() => ({
    keywords: debouncedSearch ? debouncedSearch.split(' ') : [],
    jobType: state.jobType ? [state.jobType] : undefined,
    location: state.location || undefined,
    experienceLevels: state.experienceLevels.length > 0 ? state.experienceLevels : undefined,
    salaryMin: state.salaryMin ? Number(state.salaryMin) : undefined,
    datePosted: state.datePosted,
    page: state.page,
  }), [debouncedSearch, state.jobType, state.location, state.experienceLevels, state.salaryMin, state.datePosted, state.page]);

  // Reason: Fonction de chargement des offres avec gestion de reset pour nouvelle recherche
  const loadJobs = useCallback(async (reset = false) => {
    if (reset) {
      actions.setPage(1);
      actions.setJobs([]);
    }
    
    setLoading(true);
    actions.setError(null);
    try {
      const jobs = await jobService.searchJobs(searchCriteria);
      actions.setJobs(jobs);
      actions.setTotalResults(jobs.length);
      // Reason: On considère qu'il y a plus de résultats si on reçoit une page complète
      actions.setHasMore(jobs.length === 10);
    } catch (err) {
      console.error('Error searching jobs:', err);
      actions.setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
      actions.setIsLoadingMore(false);
    }
  }, [searchCriteria, setLoading]);

  // Chargement initial des offres
  useEffect(() => {
    loadJobs(true);
  }, [loadJobs]);

  // Reason: Gestion du chargement infini lors du scroll
  useEffect(() => {
    if (inViewport && state.hasMore && !state.isLoadingMore) {
      actions.setIsLoadingMore(true);
      const nextPage = state.page + 1;
      actions.setPage(nextPage);
    }
  }, [inViewport, state.hasMore, state.isLoadingMore, state.page]);

  // Reason: Redirection vers login si non authentifié lors du clic sur une offre
  const handleJobClick = useCallback((job: Job) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/search' } });
      return;
    }
    navigate(`/jobs/${job.id}`);
  }, [isAuthenticated, navigate]);

  const handleSearch = useCallback(() => {
    loadJobs(true);
  }, [loadJobs]);

  if (state.error) {
    return <ErrorDisplay error={state.error} onRetry={() => loadJobs(true)} />;
  }

  return (
    <Container>
      <Stack gap="md">
        <SearchBar
          value={state.searchQuery}
          onChange={actions.setSearchQuery}
        />

        <SearchFilters
          keywords={state.searchQuery}
          setKeywords={actions.setSearchQuery}
          location={state.location}
          setLocation={actions.setLocation}
          jobTypes={state.jobType ? [state.jobType] : []}
          setJobTypes={(types) => actions.setJobType(types.length > 0 ? types[0] : null)}
          experienceLevels={state.experienceLevels}
          setExperienceLevels={actions.setExperienceLevels}
          salaryMin={state.salaryMin}
          setSalaryMin={actions.setSalaryMin}
          datePosted={state.datePosted}
          setDatePosted={actions.setDatePosted}
          onSearch={handleSearch}
        />

        <Text size="sm" c="dimmed">
          {state.totalResults} offres trouvées
        </Text>

        <SearchResults
          jobs={state.jobs}
          isLoading={state.isLoadingMore}
          hasMore={state.hasMore}
          onJobClick={handleJobClick}
          loadMoreRef={loadMoreRef}
        />
      </Stack>
    </Container>
  );
});