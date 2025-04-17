import React, { useState } from 'react';
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
  Collapse,
  Modal,
  Textarea
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter, IconSearch, IconCalendar, IconBriefcase, IconMapPin, IconCurrencyEuro, IconBookmark } from '@tabler/icons-react';
import type { SearchFilters as SearchFiltersType } from '../types/index';

interface SearchFiltersProps {
  onSearch: (filters: SearchFiltersType) => void;
  onReset: () => void;
  onSaveFilter?: (name: string, description: string) => void;
  isLoading?: boolean;
  initialFilters?: Partial<SearchFiltersType>;
}

const contractTypes = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Stage', label: 'Stage' },
  { value: 'Alternance', label: 'Alternance' },
  { value: 'Freelance', label: 'Freelance' },
];

const experienceLevels = [
  { value: 'Débutant', label: 'Débutant' },
  { value: 'Junior', label: 'Junior' },
  { value: 'Confirmé', label: 'Confirmé' },
  { value: 'Senior', label: 'Senior' },
  { value: 'Expert', label: 'Expert' },
];

const sortOptions = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'date', label: 'Date' },
  { value: 'salary', label: 'Salaire' },
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  onSearch,
  onReset,
  onSaveFilter,
  isLoading,
  initialFilters,
}) => {
  const [opened, { toggle }] = useDisclosure(false);
  const [saveModalOpened, { open: openSaveModal, close: closeSaveModal }] = useDisclosure(false);
  const [filterName, setFilterName] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [filters, setFilters] = React.useState<SearchFiltersType>({
    keywords: '',
    location: '',
    salaryMin: null,
    salaryMax: null,
    contractTypes: [],
    experienceLevels: [],
    remote: null,
    skills: [],
    datePosted: null,
    sortBy: 'relevance',
    ...initialFilters,
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
      remote: null,
      skills: [],
      datePosted: null,
      sortBy: 'relevance',
      ...initialFilters,
    });
    onReset();
  };

  const handleSaveFilter = () => {
    if (onSaveFilter) {
      onSaveFilter(filterName, filterDescription);
      setFilterName('');
      setFilterDescription('');
      closeSaveModal();
    }
  };

  return (
    <>
      <Paper p="md" radius="md" withBorder>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Group>
              <TextInput
                leftSection={<IconSearch size={16} />}
                placeholder="Mots-clés, compétences..."
                value={filters.keywords}
                onChange={(e) => handleChange('keywords', e.target.value)}
                style={{ flex: 1 }}
              />
              <TextInput
                leftSection={<IconMapPin size={16} />}
                placeholder="Localisation"
                value={filters.location}
                onChange={(e) => handleChange('location', e.target.value)}
                style={{ flex: 1 }}
              />
              <Button
                leftSection={<IconFilter size={16} />}
                onClick={toggle}
                variant="light"
              >
                Filtres
              </Button>
              {onSaveFilter && (
                <Button
                  leftSection={<IconBookmark size={16} />}
                  onClick={openSaveModal}
                  variant="light"
                >
                  Sauvegarder
                </Button>
              )}
            </Group>

            <Collapse in={opened}>
              <Stack gap="md">
                <Group grow>
                  <NumberInput
                    leftSection={<IconCurrencyEuro size={16} />}
                    label="Salaire minimum"
                    value={filters.salaryMin || undefined}
                    onChange={(value) => handleChange('salaryMin', value)}
                    min={0}
                  />
                  <NumberInput
                    leftSection={<IconCurrencyEuro size={16} />}
                    label="Salaire maximum"
                    value={filters.salaryMax || undefined}
                    onChange={(value) => handleChange('salaryMax', value)}
                    min={0}
                  />
                </Group>

                <MultiSelect
                  leftSection={<IconBriefcase size={16} />}
                  label="Types de contrat"
                  data={contractTypes}
                  value={filters.contractTypes}
                  onChange={(value) => handleChange('contractTypes', value)}
                />

                <MultiSelect
                  label="Niveaux d'expérience"
                  data={experienceLevels}
                  value={filters.experienceLevels}
                  onChange={(value) => handleChange('experienceLevels', value)}
                />

                <DateInput
                  leftSection={<IconCalendar size={16} />}
                  label="Date de publication"
                  value={filters.datePosted}
                  onChange={(value) => handleChange('datePosted', value)}
                  maxDate={new Date()}
                />

                <Select
                  label="Trier par"
                  data={sortOptions}
                  value={filters.sortBy}
                  onChange={(value) => handleChange('sortBy', value as SearchFiltersType['sortBy'])}
                />
              </Stack>
            </Collapse>

            <Group justify="flex-end">
              <Button variant="light" onClick={handleReset}>
                Réinitialiser
              </Button>
              <Button type="submit" loading={isLoading}>
                Rechercher
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>

      <Modal
        opened={saveModalOpened}
        onClose={closeSaveModal}
        title="Sauvegarder les filtres"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Nom du filtre"
            placeholder="Ex: Développeur Fullstack Paris"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            required
          />
          <Textarea
            label="Description"
            placeholder="Description du filtre (optionnel)"
            value={filterDescription}
            onChange={(e) => setFilterDescription(e.target.value)}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeSaveModal}>
              Annuler
            </Button>
            <Button 
              onClick={handleSaveFilter}
              disabled={!filterName}
            >
              Sauvegarder
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}; 