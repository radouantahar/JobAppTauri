import React, { useState } from 'react';
import { TextInput, Button, Group } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch,
  placeholder = "Rechercher des offres..."
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Group gap="sm">
        <TextInput
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          style={{ flex: 1 }}
        />
        <Button type="submit" leftSection={<IconSearch size={16} />}>
          Rechercher
        </Button>
      </Group>
    </form>
  );
}; 