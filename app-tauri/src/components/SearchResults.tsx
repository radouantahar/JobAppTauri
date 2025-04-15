import { Stack, Text, LoadingOverlay } from '@mantine/core';
import { JobCard } from './JobCard';
import type { Job } from '../types';

interface SearchResultsProps {
  jobs: Job[];
  isLoading?: boolean;
  error?: string | null;
  onJobClick?: (job: Job) => void;
}

export const SearchResults = ({ jobs, isLoading, error, onJobClick }: SearchResultsProps) => {
  if (error) {
    return (
      <Text c="red" ta="center">
        {error}
      </Text>
    );
  }

  return (
    <Stack pos="relative">
      <LoadingOverlay visible={!!isLoading} />
      {jobs.length === 0 ? (
        <Text ta="center">Aucun résultat trouvé</Text>
      ) : (
        jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onClick={() => onJobClick?.(job)}
          />
        ))
      )}
    </Stack>
  );
}; 