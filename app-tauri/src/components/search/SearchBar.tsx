import React, { useState } from 'react';
import { TextInput, Button, Group } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Group>
        <TextInput
          placeholder="Rechercher des offres..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button type="submit" leftSection={<IconSearch size={16} />}>
          Rechercher
        </Button>
      </Group>
    </form>
  );
}; 