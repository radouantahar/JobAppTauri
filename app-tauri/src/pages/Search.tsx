// pages/Search.tsx
import { useState, useCallback, useRef } from 'react';
import { Container, Stack, Text, Loader, Center } from '@mantine/core';
import { SearchBar } from '../components/search/SearchBar';
import { SearchResults } from '../components/search/SearchResults';
import { useJobSearch } from '../hooks/useJobSearch';
import { Job, SearchCriteria } from '../types';
import { useAuth } from '../hooks/useAuth';

export const SearchPage = () => {
  const { user } = useAuth();
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({});
  const { jobs, isLoading, error, hasMore, search } = useJobSearch();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchCriteria(prev => ({ ...prev, query }));
    search({ ...searchCriteria, query });
  }, [search, searchCriteria]);

  const handleJobClick = useCallback((job: Job) => {
    // TODO: Naviguer vers la page de détails du job
    console.log('Job clicked:', job);
  }, []);

  if (!user) {
    return (
      <Center h="100vh">
        <Text>Veuillez vous connecter pour accéder à la recherche</Text>
      </Center>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <SearchBar onSearch={handleSearch} />
        {isLoading && jobs.length === 0 ? (
          <Center>
            <Loader />
          </Center>
        ) : error ? (
          <Text color="red">{error}</Text>
        ) : (
          <SearchResults
            jobs={jobs}
            isLoading={isLoading}
            hasMore={hasMore}
            onJobClick={handleJobClick}
            loadMoreRef={(node) => {
              loadMoreRef.current = node;
              if (node && hasMore && !isLoading) {
                const nextPage = (searchCriteria.page || 1) + 1;
                setSearchCriteria(prev => ({ ...prev, page: nextPage }));
                search({ ...searchCriteria, page: nextPage });
              }
            }}
          />
        )}
      </Stack>
    </Container>
  );
};