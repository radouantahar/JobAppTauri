// pages/Commute.tsx
import { useState } from 'react';
import { Container, Title, TextInput, Button, Stack } from '@mantine/core';
import type { SearchCriteria } from '../types';
import { useJobSearch } from '../hooks/useJobSearch';

const CommutePage: React.FC = () => {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    location: '',
    jobType: [],
    experienceLevel: [],
    salaryMin: 0,
    salaryMax: 0,
    skills: [],
    remote: false
  });

  const { search } = useJobSearch();

  const handleSearch = () => {
    search(searchCriteria);
  };

  return (
    <Container size="md" py="xl">
      <Title order={2} mb="xl">Temps de trajet</Title>
      <Stack gap="md">
        <TextInput
          label="Localisation"
          value={searchCriteria.location}
          onChange={(e) => setSearchCriteria({ ...searchCriteria, location: e.target.value })}
        />
        <Button onClick={handleSearch}>Rechercher</Button>
      </Stack>
    </Container>
  );
};

export default CommutePage;