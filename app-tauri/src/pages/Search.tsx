// pages/Search.tsx
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Container, Stack, Text, Loader, Center, Alert, Button, Group, Paper } from '@mantine/core';
import { IconAlertCircle, IconRefresh, IconBookmark } from '@tabler/icons-react';
import { SearchResults } from '../components/SearchResults';
import { SearchFilters } from '../components/SearchFilters';
import { useJobSearch } from '../hooks/useJobSearch';
import { useAuth } from '../contexts/AuthContext';
import type { AuthContextType } from '../contexts/AuthContext';
import type { Job, SearchFilters as SearchFiltersType } from '../types/index';
import { searchPreferencesService } from '../services/searchPreferences';
import { notifications } from '@mantine/notifications';
import { SearchForm } from '../components/SearchForm';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../services/api';
import type { SearchCriteria } from '../types/search';

const Search: React.FC = () => {
  const { user, isAuthenticated } = useAuth() as AuthContextType;
  const { jobs, isLoading, error, hasMore, search, loadMore } = useJobSearch();
  const [currentFilters, setCurrentFilters] = useState<SearchFiltersType>({
    keywords: '',
    location: '',
    salaryMin: null,
    salaryMax: null,
    contractTypes: [],
    experienceLevels: [],
    remote: null,
    skills: [],
    datePosted: null,
    sortBy: 'relevance',
  });
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserPreferences();
      loadSavedFilters();
    }
  }, [isAuthenticated, user]);

  const loadUserPreferences = async () => {
    try {
      const preferences = await searchPreferencesService.getSearchPreferences(user!.id);
      setCurrentFilters({
        ...currentFilters,
        location: preferences.location || '',
        salaryMin: preferences.salary_min || null,
        salaryMax: preferences.salary_max || null,
        contractTypes: preferences.contract_types || [],
        experienceLevels: preferences.experience_levels || [],
        remote: preferences.remote ?? null,
        skills: preferences.skills || [],
      });
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const loadSavedFilters = async () => {
    try {
      const filters = await searchPreferencesService.getSavedFilters(user!.id);
      setSavedFilters(filters);
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  };

  const handleSaveFilter = async (name: string) => {
    try {
      await searchPreferencesService.saveFilter({
        id: '',
        user_id: user!.id,
        name,
        keywords: currentFilters.keywords,
        location: currentFilters.location,
        salary_min: currentFilters.salaryMin ?? undefined,
        salary_max: currentFilters.salaryMax ?? undefined,
        contract_types: currentFilters.contractTypes,
        experience_levels: currentFilters.experienceLevels,
        remote: currentFilters.remote ?? undefined,
        skills: currentFilters.skills
      });
      await loadSavedFilters();
      notifications.show({
        title: 'Succès',
        message: 'Filtre sauvegardé avec succès',
        color: 'green',
      });
    } catch (error) {
      console.error('Error saving filter:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de sauvegarder le filtre',
        color: 'red',
      });
    }
  };

  const handleApplyFilter = (filter: any) => {
    setCurrentFilters({
      keywords: filter.keywords || '',
      location: filter.location || '',
      salaryMin: filter.salary_min || null,
      salaryMax: filter.salary_max || null,
      contractTypes: filter.contract_types || [],
      experienceLevels: filter.experience_levels || [],
      remote: filter.remote || undefined,
      skills: filter.skills || [],
      datePosted: null,
      sortBy: 'relevance',
    });
    search({
      keywords: filter.keywords || '',
      location: filter.location || '',
      salaryMin: filter.salary_min || null,
      salaryMax: filter.salary_max || null,
      contractTypes: filter.contract_types || [],
      experienceLevels: filter.experience_levels || [],
      remote: filter.remote || undefined,
      skills: filter.skills || [],
      datePosted: null,
      sortBy: 'relevance',
    });
  };

  const handleSearch = useCallback((filters: SearchFiltersType) => {
    // Annuler le délai précédent s'il existe
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Définir un nouveau délai de 500ms
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentFilters(filters);
      search(filters);
    }, 500);
  }, [search]);

  const handleJobClick = useCallback((job: Job) => {
    // TODO: Naviguer vers la page de détails du job
    console.log('Job clicked:', job);
  }, []);

  const handleRetry = useCallback(() => {
    search(currentFilters);
  }, [search, currentFilters]);

  const handleReset = () => {
    setCurrentFilters({
      keywords: '',
      location: '',
      salaryMin: null,
      salaryMax: null,
      contractTypes: [],
      experienceLevels: [],
      remote: null,
      skills: [],
      datePosted: null,
      sortBy: 'relevance',
    });
  };

  // Nettoyer le délai lors du démontage du composant
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <Center h="100vh">
        <Text>Veuillez vous connecter pour accéder à la recherche</Text>
      </Center>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="md">
        <SearchFilters
          onSearch={handleSearch}
          onReset={handleReset}
          onSaveFilter={handleSaveFilter}
          isLoading={isLoading}
          initialFilters={currentFilters}
        />

        {savedFilters.length > 0 && (
          <Paper p="md" radius="md" withBorder>
            <Text fw={500} mb="md">Filtres sauvegardés</Text>
            <Group gap="sm">
              {savedFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant="light"
                  leftSection={<IconBookmark size={16} />}
                  onClick={() => handleApplyFilter(filter)}
                >
                  {filter.name}
                </Button>
              ))}
            </Group>
          </Paper>
        )}
        
        {error ? (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Erreur" 
            color="red"
            variant="filled"
          >
            <Stack gap="xs">
              <Text>{error}</Text>
              <Button 
                leftSection={<IconRefresh size={16} />}
                onClick={handleRetry}
                variant="light"
              >
                Réessayer
              </Button>
            </Stack>
          </Alert>
        ) : isLoading && jobs.length === 0 ? (
          <Center>
            <Loader size="xl" />
          </Center>
        ) : (
          <SearchResults
            jobs={jobs}
            loading={isLoading}
            error={error}
            onJobClick={handleJobClick}
            onLoadMore={loadMore}
            hasMore={hasMore}
            searchQuery={currentFilters.keywords}
          />
        )}

        {!isLoading && jobs.length === 0 && !error && (
          <Text ta="center" c="dimmed">
            Aucune offre trouvée. Essayez de modifier vos critères de recherche.
          </Text>
        )}
      </Stack>
    </Container>
  );
};

export default Search;