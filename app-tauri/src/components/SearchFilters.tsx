import React from 'react';
import { 
  Paper, 
  Stack, 
  TextInput, 
  Select, 
  NumberInput, 
  MultiSelect, 
  Button, 
  Group,
  Text,
  Collapse
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter, IconSearch, IconCalendar, IconBriefcase, IconMapPin, IconCurrencyEuro } from '@tabler/icons-react';
import type { SearchFilters as SearchFiltersType } from '../types';

interface SearchFiltersProps {
  onSearch: (filters: SearchFiltersType) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const jobTypes = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Stage', label: 'Stage' },
  { value: 'Alternance', label: 'Alternance' },
  { value: 'Freelance', label: 'Freelance' },
];

const experienceLevels = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Confirmé' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Expert' },
];

const skills = [
  { value: 'react', label: 'React' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'sql', label: 'SQL' },
  { value: 'aws', label: 'AWS' },
  { value: 'docker', label: 'Docker' },
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({ onSearch, onReset, isLoading }) => {
  const [opened, { toggle }] = useDisclosure(false);
  const [filters, setFilters] = React.useState<SearchFiltersType>({
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
  });

  const handleChange = (field: keyof SearchFiltersType, value: string | number | string[] | Date | boolean | null | undefined) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
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
    });
    onReset();
  };

  return (
    <Paper p="md" withBorder>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={500} fz="lg">Recherche avancée</Text>
            <Button
              variant="subtle"
              leftSection={<IconFilter size={16} />}
              onClick={toggle}
            >
              {opened ? 'Masquer les filtres' : 'Afficher les filtres'}
            </Button>
          </Group>

          <TextInput
            label="Mots-clés"
            placeholder="Développeur, Python, React..."
            value={filters.keywords}
            onChange={(e) => handleChange('keywords', e.target.value)}
            leftSection={<IconSearch size={16} />}
          />

          <TextInput
            label="Localisation"
            placeholder="Paris, Lyon, Remote..."
            value={filters.location}
            onChange={(e) => handleChange('location', e.target.value)}
            leftSection={<IconMapPin size={16} />}
          />

          <Collapse in={opened}>
            <Stack gap="md">
              <Group grow>
                <MultiSelect
                  label="Type de contrat"
                  placeholder="Sélectionnez un ou plusieurs types"
                  data={jobTypes}
                  value={filters.contractTypes}
                  onChange={(value) => handleChange('contractTypes', value)}
                  leftSection={<IconBriefcase size={16} />}
                />
                <MultiSelect
                  label="Niveau d'expérience"
                  placeholder="Sélectionnez un ou plusieurs niveaux"
                  data={experienceLevels}
                  value={filters.experienceLevels}
                  onChange={(value) => handleChange('experienceLevels', value)}
                />
              </Group>

              <Group grow>
                <NumberInput
                  label="Salaire minimum (€)"
                  placeholder="30000"
                  value={filters.salaryMin || undefined}
                  onChange={(value) => handleChange('salaryMin', value)}
                  min={0}
                  leftSection={<IconCurrencyEuro size={16} />}
                />
                <NumberInput
                  label="Salaire maximum (€)"
                  placeholder="60000"
                  value={filters.salaryMax || undefined}
                  onChange={(value) => handleChange('salaryMax', value)}
                  min={0}
                  leftSection={<IconCurrencyEuro size={16} />}
                />
              </Group>

              <MultiSelect
                label="Compétences"
                placeholder="Sélectionnez une ou plusieurs compétences"
                data={skills}
                value={filters.skills}
                onChange={(value) => handleChange('skills', value)}
                searchable
              />

              <DateInput
                label="Date de publication"
                placeholder="Sélectionnez une date"
                value={filters.datePosted}
                onChange={(value: Date | null) => handleChange('datePosted', value)}
                leftSection={<IconCalendar size={16} />}
                maxDate={new Date()}
              />

              <Select
                label="Trier par"
                placeholder="Sélectionnez un critère de tri"
                data={[
                  { value: 'relevance', label: 'Pertinence' },
                  { value: 'date', label: 'Date de publication' },
                  { value: 'salary', label: 'Salaire' },
                ]}
                value={filters.sortBy}
                onChange={(value) => handleChange('sortBy', value)}
              />

              <Select
                label="Télétravail"
                placeholder="Sélectionnez une option"
                data={[
                  { value: 'true', label: 'Télétravail uniquement' },
                  { value: 'false', label: 'Présentiel uniquement' },
                  { value: 'undefined', label: 'Les deux' },
                ]}
                value={filters.remote === undefined ? 'undefined' : String(filters.remote)}
                onChange={(value) => handleChange('remote', value === 'undefined' ? undefined : value === 'true')}
                clearable
              />
            </Stack>
          </Collapse>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleReset}>
              Réinitialiser
            </Button>
            <Button 
              type="submit" 
              loading={isLoading}
              leftSection={<IconFilter size={16} />}
            >
              Appliquer les filtres
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}; 