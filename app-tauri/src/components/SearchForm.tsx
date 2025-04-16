import React from 'react';
import { useForm } from '@mantine/form';
import { TextInput, MultiSelect, NumberInput, Switch, Button, Group, Stack } from '@mantine/core';
import type { SearchFilters } from '../types';

interface SearchFormProps {
  onSubmit: (values: SearchFilters) => void;
  initialValues?: Partial<SearchFilters>;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSubmit, initialValues }) => {
  const form = useForm<SearchFilters>({
    initialValues: {
      keywords: '',
      location: '',
      salaryMin: null,
      salaryMax: null,
      contractTypes: [],
      experienceLevels: [],
      remote: undefined,
      skills: [],
      datePosted: null,
      sortBy: 'relevance',
      ...initialValues
    }
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput
          label="Mots-clés"
          {...form.getInputProps('keywords')}
        />
        <TextInput
          label="Localisation"
          {...form.getInputProps('location')}
        />
        <MultiSelect
          label="Type de contrat"
          data={['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance']}
          {...form.getInputProps('contractTypes')}
        />
        <MultiSelect
          label="Niveau d'expérience"
          data={['junior', 'mid', 'senior', 'lead']}
          {...form.getInputProps('experienceLevels')}
        />
        <NumberInput
          label="Salaire minimum"
          {...form.getInputProps('salaryMin')}
        />
        <NumberInput
          label="Salaire maximum"
          {...form.getInputProps('salaryMax')}
        />
        <MultiSelect
          label="Compétences"
          data={['React', 'TypeScript', 'Python', 'Java', 'Node.js', 'SQL', 'AWS', 'Docker']}
          {...form.getInputProps('skills')}
        />
        <Switch
          label="Télétravail"
          {...form.getInputProps('remote', { type: 'checkbox' })}
        />
        <Group justify="flex-end">
          <Button type="submit">Rechercher</Button>
        </Group>
      </Stack>
    </form>
  );
}; 