// pages/Commute.tsx
import { useState } from 'react';
import { Container, Title, TextInput, Button, Stack } from '@mantine/core';
import type { SearchFilters } from '../types';
import { useJobSearch } from '../hooks/useJobSearch';

const defaultFilters: SearchFilters = {
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

const CommutePage: React.FC = () => {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(defaultFilters);

  const { search } = useJobSearch();

  const handleSearch = () => {
    search(searchFilters);
  };

  return (
    <Container size="md" py="xl">
      <Title order={2} mb="xl">Temps de trajet</Title>
      <Stack gap="md">
        <TextInput
          label="Localisation"
          value={searchFilters.location}
          onChange={(e) => setSearchFilters({ ...searchFilters, location: e.target.value })}
        />
        <Button onClick={handleSearch}>Rechercher</Button>
      </Stack>
    </Container>
  );
};

export default CommutePage;