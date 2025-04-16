// pages/Search.tsx
import React, { useState } from 'react';
import { Container, Stack, Text, Loader, Center, Alert, Button } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { SearchBar } from '../components/search/SearchBar';
import { SearchResults } from '../components/SearchResults';
import { useJobSearch } from '../hooks/useJobSearch';
import type { Job, SearchFilters } from '../types';
import { useAuth } from '../hooks/useAuth';

const initialFilters: SearchFilters = {
  keywords: '',
  location: '',
  salaryMin: null,
  salaryMax: null,
  contractTypes: [],
  experienceLevels: [],
  remote: undefined,
  skills: [],
  datePosted: null,
  sortBy: 'relevance'
};

const Search: React.FC = () => {
  const { user } = useAuth();
  const { jobs, isLoading, error, hasMore, search, loadMore } = useJobSearch();
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSearch = React.useCallback((query: string) => {
    // Annuler le délai précédent s'il existe
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Définir un nouveau délai de 500ms
    searchTimeoutRef.current = setTimeout(() => {
      const filters: SearchFilters = {
        keywords: query,
        location: '',
        salaryMin: null,
        salaryMax: null,
        contractTypes: [],
        experienceLevels: [],
        remote: undefined,
        skills: [],
        datePosted: null,
        sortBy: 'relevance'
      };
      search(filters);
    }, 500);
  }, [search]);

  const handleJobClick = React.useCallback((job: Job) => {
    // TODO: Naviguer vers la page de détails du job
    console.log('Job clicked:', job);
  }, []);

  const handleRetry = React.useCallback(() => {
    const filters: SearchFilters = {
      keywords: '',
      location: '',
      salaryMin: null,
      salaryMax: null,
      contractTypes: [],
      experienceLevels: [],
      remote: undefined,
      skills: [],
      datePosted: null,
      sortBy: 'relevance'
    };
    search(filters);
  }, [search]);

  // Nettoyer le délai lors du démontage du composant
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (!user) {
    return (
      <Center h="100vh">
        <Text>Veuillez vous connecter pour accéder à la recherche</Text>
      </Center>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="md">
        <SearchBar onSearch={handleSearch} />
        
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
            isLoading={isLoading}
            error={error}
            hasMore={hasMore}
            onJobClick={handleJobClick}
            loadMoreRef={(node) => {
              loadMoreRef.current = node;
              if (node && hasMore && !isLoading) {
                loadMore();
              }
            }}
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