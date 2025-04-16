import React, { useState } from 'react';
import { Container, Stack, Title, Notification } from '@mantine/core';
import { SearchFilters } from '../components/SearchFilters';
import { JobSearchResults } from '../components/JobSearchResults';
import { useJobSearch } from '../hooks/useJobSearch';
import type { SearchFilters as SearchFiltersType, Job } from '../types';
import { invoke } from '@tauri-apps/api/tauri';

export const SearchPage: React.FC = () => {
  const { jobs, isLoading, error, search } = useJobSearch();
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSearch = async (filters: SearchFiltersType) => {
    await search(filters);
    setCurrentPage(1);
  };

  const handleReset = () => {
    const defaultFilters: SearchFiltersType = {
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
    handleSearch(defaultFilters);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // TODO: Implémenter la pagination côté serveur
  };

  const handleSaveJob = async (job: Job) => {
    try {
      await invoke('save_job', { job });
      setNotification({ message: 'Offre sauvegardée avec succès', type: 'success' });
    } catch (err) {
      setNotification({ message: 'Erreur lors de la sauvegarde de l\'offre', type: 'error' });
    }
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={1}>Recherche d'emploi</Title>
        
        {notification && (
          <Notification
            color={notification.type === 'success' ? 'green' : 'red'}
            onClose={() => setNotification(null)}
          >
            {notification.message}
          </Notification>
        )}
        
        <SearchFilters 
          onSearch={handleSearch}
          onReset={handleReset}
          isLoading={isLoading}
        />

        <JobSearchResults
          jobs={jobs}
          isLoading={isLoading}
          error={error}
          currentPage={currentPage}
          totalPages={10} // TODO: Récupérer le nombre total de pages depuis le serveur
          onPageChange={handlePageChange}
          onSaveJob={handleSaveJob}
        />
      </Stack>
    </Container>
  );
}; 