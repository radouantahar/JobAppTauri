import React, { useState } from 'react';
import { TextInput, Button, Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import styles from '../../styles/components/SearchBar.module.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading = false }) => {
  const [query, setQuery] = useState('');
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <TextInput
          className={styles.searchInput}
          placeholder="Rechercher un emploi..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          size={isMobile ? 'sm' : 'md'}
        />
        <Button
          className={styles.searchButton}
          type="submit"
          loading={isLoading}
          size={isMobile ? 'sm' : 'md'}
        >
          Rechercher
        </Button>
      </form>
    </div>
  );
}; 