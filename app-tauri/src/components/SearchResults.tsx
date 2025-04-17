import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { FixedSizeList as List, ListChildComponentProps, ListOnScrollProps } from 'react-window';
import { JobCard } from './JobCard';
import { Loader, Alert, Text, Transition } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import styles from '../styles/components/SearchResults.module.css';
import type { Job } from '../types/job';

interface SearchResultsProps {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  onJobClick?: (job: Job) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  searchQuery?: string;
}

const ITEM_HEIGHT = 220; // Hauteur ajustée pour inclure le padding
const ITEM_PADDING = 16;
const LOADING_THRESHOLD = 5; // Nombre d'éléments avant la fin pour déclencher le chargement
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const PRELOAD_THRESHOLD = 3; // Nombre d'éléments avant la fin pour précharger

const SearchResultsComponent: React.FC<SearchResultsProps> = ({
  jobs,
  loading,
  error,
  onJobClick,
  onLoadMore,
  hasMore = false,
  searchQuery = ''
}) => {
  const [listHeight, setListHeight] = useState(window.innerHeight - 200); // Hauteur ajustée pour le header
  const [isTransitioning, setIsTransitioning] = useState(false);
  const cacheRef = useRef<{
    data: Job[];
    query: string;
    timestamp: number;
    scrollPosition: number;
  }>({ data: [], query: '', timestamp: 0, scrollPosition: 0 });
  const listRef = useRef<List>(null);

  // Mise à jour de la hauteur de la liste avec debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setListHeight(window.innerHeight - 200);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Gestion du cache et préchargement
  useEffect(() => {
    const now = Date.now();
    if (cacheRef.current.query === searchQuery && 
        now - cacheRef.current.timestamp < CACHE_EXPIRY) {
      if (listRef.current && cacheRef.current.scrollPosition) {
        listRef.current.scrollTo(cacheRef.current.scrollPosition);
      }
      return;
    }

    if (listRef.current) {
      const list = listRef.current;
      const scrollOffset = (list as any).state.scrollOffset;
      cacheRef.current.scrollPosition = scrollOffset;
    }

    cacheRef.current = {
      data: jobs,
      query: searchQuery,
      timestamp: now,
      scrollPosition: 0
    };

    if (hasMore && !loading && onLoadMore && jobs.length > PRELOAD_THRESHOLD) {
      onLoadMore();
    }
  }, [jobs, searchQuery, hasMore, loading, onLoadMore]);

  const Row = useMemo(() => React.memo(({ index, style }: ListChildComponentProps) => {
    const job = jobs[index];
    
    // Vérifier si nous devons charger plus d'éléments
    if (index === jobs.length - LOADING_THRESHOLD && hasMore && !loading && onLoadMore) {
      onLoadMore();
    }

    return (
      <Transition
        mounted={!isTransitioning}
        transition="fade"
        duration={200}
        timingFunction="ease"
      >
        {(transitionStyles) => (
          <div style={{ ...style, ...transitionStyles, padding: `${ITEM_PADDING}px 0` }}>
            <JobCard
              key={job.id}
              job={job}
              onClick={onJobClick}
            />
          </div>
        )}
      </Transition>
    );
  }), [jobs, onJobClick, onLoadMore, hasMore, loading, isTransitioning]);

  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    cacheRef.current.scrollPosition = scrollOffset;
  }, []);

  if (error) {
    return (
      <Transition
        mounted={true}
        transition="fade"
        duration={200}
        timingFunction="ease"
      >
        {(transitionStyles) => (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Erreur" 
            color="red"
            style={transitionStyles}
          >
            <Text>{error}</Text>
          </Alert>
        )}
      </Transition>
    );
  }

  if (jobs.length === 0 && !loading) {
    return (
      <Transition
        mounted={true}
        transition="fade"
        duration={200}
        timingFunction="ease"
      >
        {(transitionStyles) => (
          <div style={transitionStyles}>
            <Text>Aucun résultat trouvé</Text>
          </div>
        )}
      </Transition>
    );
  }

  return (
    <div className={styles.container} data-testid="search-results-container">
      {loading && (
        <div className={styles.loadingOverlay}>
          <Loader size="md" />
        </div>
      )}
      <List
        ref={listRef}
        height={listHeight}
        itemCount={jobs.length}
        itemSize={ITEM_HEIGHT}
        width="100%"
        overscanCount={5}
        onScroll={handleScroll}
      >
        {Row}
      </List>
      {loading && hasMore && (
        <div className={styles.loadingMore}>
          <Loader size="sm" />
          <Text>Chargement des résultats suivants...</Text>
        </div>
      )}
    </div>
  );
};

export const SearchResults = React.memo(SearchResultsComponent); 