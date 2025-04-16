import React from 'react';
import { Group, Badge, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import type { SearchFilters as SearchFiltersType } from '../types';

interface ActiveFiltersProps {
  filters: SearchFiltersType;
  onRemoveFilter: (filterKey: keyof SearchFiltersType) => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({ filters, onRemoveFilter }) => {
  const getFilterLabel = (key: keyof SearchFiltersType, value: any): string => {
    switch (key) {
      case 'keywords':
        return `Mots-clés: ${value}`;
      case 'location':
        return `Localisation: ${value}`;
      case 'salaryMin':
        return `Salaire min: ${value}€`;
      case 'salaryMax':
        return `Salaire max: ${value}€`;
      case 'contractTypes':
        return value.length > 0 ? `Contrat: ${value.join(', ')}` : '';
      case 'experienceLevels':
        return value.length > 0 ? `Expérience: ${value.join(', ')}` : '';
      case 'remote':
        return value === true ? 'Télétravail uniquement' : value === false ? 'Présentiel uniquement' : '';
      case 'skills':
        return value.length > 0 ? `Compétences: ${value.join(', ')}` : '';
      case 'datePosted':
        return value ? `Publié après: ${new Date(value).toLocaleDateString()}` : '';
      case 'sortBy':
        return `Tri: ${value === 'date' ? 'Date' : value === 'salary' ? 'Salaire' : 'Pertinence'}`;
      default:
        return '';
    }
  };

  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => {
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    })
    .map(([key, value]) => {
      const label = getFilterLabel(key as keyof SearchFiltersType, value);
      if (!label) return null;
      
      return (
        <Badge
          key={key}
          size="lg"
          variant="light"
          rightSection={
            <ActionIcon
              size="xs"
              color="blue"
              radius="xl"
              variant="transparent"
              onClick={() => onRemoveFilter(key as keyof SearchFiltersType)}
            >
              <IconX size={14} />
            </ActionIcon>
          }
        >
          {label}
        </Badge>
      );
    })
    .filter(Boolean);

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <Group gap="xs" align="center" wrap="wrap">
      <Text size="sm" fw={500}>Filtres actifs:</Text>
      {activeFilters}
    </Group>
  );
}; 