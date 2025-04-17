import React, { useState } from 'react';
import { Container, Title, Stack, Text, Paper } from '@mantine/core';
import { SearchFilters } from './SearchFilters';
import { JobSearchResults } from './JobSearchResults';
import { useJobSearch } from '../hooks/useJobSearch';
import type { SearchFilters as SearchFiltersType } from '../types';

export const JobSearch: React.FC = () => {
  const [filters, setFilters] = useState<SearchFiltersType>({
    keywords: '',
    location: '',
    salaryMin: null,
    salaryMax: null,
    contractTypes: [],
    experienceLevels: [],
    remote: undefined,
    skills: [],
    datePosted: null,
    sortBy: 'relevance',
  });

  const {
    jobs,
    isLoading,
    error,
    search,
    saveJob,
  } = useJobSearch();

  const handleSearch = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    search(newFilters);
  };

  const handleReset = () => {
    setFilters({
      keywords: '',
      location: '',
      salaryMin: null,
      salaryMax: null,
      contractTypes: [],
      experienceLevels: [],
      remote: undefined,
      skills: [],
      datePosted: null,
      sortBy: 'relevance',
    });
    search({} as SearchFiltersType);
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={2}>Recherche d'emploi</Title>
        
        <Paper shadow="sm" p="md" radius="md">
          <SearchFilters
            onSearch={handleSearch}
            onReset={handleReset}
            isLoading={isLoading}
          />
        </Paper>

        {error && (
          <Text color="red" size="sm">
            {error}
          </Text>
        )}

        <JobSearchResults
          jobs={jobs}
          isLoading={isLoading}
          error={error}
          onSaveJob={saveJob}
          onPageChange={() => {}}
          currentPage={1}
          totalPages={1}
        />
      </Stack>
    </Container>
  );
};

export default JobSearch; 