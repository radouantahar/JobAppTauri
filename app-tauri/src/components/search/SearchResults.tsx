import { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { Stack, Text, LoadingOverlay } from '@mantine/core';
import { JobCard } from '../JobCard';
import type { Job } from '../../types';

interface SearchResultsProps {
  jobs: Job[];
  isLoading: boolean;
  hasMore: boolean;
  onJobClick: (job: Job) => void;
  loadMoreRef: (node: HTMLDivElement | null) => void;
}

export const SearchResults = memo(function SearchResults({
  jobs,
  isLoading,
  hasMore,
  onJobClick,
  loadMoreRef,
}: SearchResultsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleJobClick = useCallback((job: Job) => {
    onJobClick(job);
  }, [onJobClick]);

  const jobCards = useMemo(() => 
    jobs.map((job) => (
      <JobCard
        key={job.id}
        job={job}
        onClick={() => handleJobClick(job)}
      />
    ))
  , [jobs, handleJobClick]);

  const loadingIndicator = useMemo(() => 
    hasMore && (
      <div ref={loadMoreRef}>
        <LoadingOverlay visible={isLoading} />
      </div>
    )
  , [hasMore, isLoading, loadMoreRef]);

  const noResultsMessage = useMemo(() => 
    !isLoading && jobs.length === 0 && (
      <Text ta="center" c="dimmed">
        Aucune offre trouvée
      </Text>
    )
  , [isLoading, jobs.length]);

  useEffect(() => {
    if (containerRef.current && !isLoading && hasMore) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMoreRef(containerRef.current);
          }
        },
        { threshold: 0.5 }
      );

      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [isLoading, hasMore, loadMoreRef]);

  return (
    <Stack gap="md" ref={containerRef}>
      {jobCards}
      {loadingIndicator}
      {noResultsMessage}
    </Stack>
  );
}); 