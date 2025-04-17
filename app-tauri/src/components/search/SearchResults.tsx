import { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { Stack, Text, LoadingOverlay } from '@mantine/core';
import { JobCard } from '../JobCard';
import type { Job } from '../../types/job';
import styles from '../../styles/components/SearchResults.module.css';

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
      <div ref={loadMoreRef} className={styles.loadingOverlay}>
        <LoadingOverlay visible={isLoading} data-testid="loading-overlay" />
      </div>
    )
  , [hasMore, isLoading, loadMoreRef]);

  const noResultsMessage = useMemo(() => 
    !isLoading && jobs.length === 0 && (
      <Text className={styles.emptyState}>
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
    <div className={styles.container}>
      <div className={styles.resultsGrid} ref={containerRef}>
        {jobCards}
        {loadingIndicator}
        {noResultsMessage}
      </div>
    </div>
  );
}); 