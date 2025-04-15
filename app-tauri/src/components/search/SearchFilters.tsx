import { memo, useMemo, useCallback } from 'react';
import { Stack, TextInput, MultiSelect, NumberInput, Select, Button } from '@mantine/core';
import type { JobType, ExperienceLevel } from '../../types';

export type DatePostedOption = '24h' | 'week' | 'last_week' | 'month' | 'any';

const DATE_POSTED_OPTIONS = [
  { value: '24h', label: '24 dernières heures' },
  { value: 'week', label: '7 derniers jours' },
  { value: 'last_week', label: 'Semaine dernière' },
  { value: 'month', label: '30 derniers jours' },
  { value: 'any', label: 'Toutes les dates' },
] as const;

const JOB_TYPE_OPTIONS = [
  { value: 'full-time', label: 'CDI' },
  { value: 'part-time', label: 'Temps partiel' },
  { value: 'contract', label: 'Contrat' },
  { value: 'internship', label: 'Stage' },
  { value: 'temporary', label: 'Intérim' },
] as const;

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'entry', label: 'Débutant' },
  { value: 'mid', label: 'Intermédiaire' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
] as const;

interface SearchFiltersProps {
  keywords: string;
  setKeywords: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  jobTypes: JobType[];
  setJobTypes: (value: JobType[]) => void;
  experienceLevels: ExperienceLevel[];
  setExperienceLevels: (value: ExperienceLevel[]) => void;
  salaryMin: number | '';
  setSalaryMin: (value: number | '') => void;
  datePosted: DatePostedOption;
  setDatePosted: (value: DatePostedOption) => void;
  onSearch: () => void;
}

export const SearchFilters = memo(function SearchFilters({
  keywords,
  setKeywords,
  location,
  setLocation,
  jobTypes,
  setJobTypes,
  experienceLevels,
  setExperienceLevels,
  salaryMin,
  setSalaryMin,
  datePosted,
  setDatePosted,
  onSearch,
}: SearchFiltersProps) {
  const handleJobTypesChange = useCallback((values: string[]) => {
    setJobTypes(values as JobType[]);
  }, [setJobTypes]);

  const handleExperienceLevelsChange = useCallback((values: string[]) => {
    setExperienceLevels(values as ExperienceLevel[]);
  }, [setExperienceLevels]);

  const handleSalaryMinChange = useCallback((value: string | number) => {
    setSalaryMin(value === '' ? '' : Number(value));
  }, [setSalaryMin]);

  const handleDatePostedChange = useCallback((value: string | null) => {
    if (value) {
      setDatePosted(value as DatePostedOption);
    }
  }, [setDatePosted]);

  const handleSearch = useCallback(() => {
    onSearch();
  }, [onSearch]);

  const clearFilters = useCallback(() => {
    setKeywords('');
    setLocation('');
    setJobTypes([]);
    setExperienceLevels([]);
    setSalaryMin('');
    setDatePosted('any');
  }, [setKeywords, setLocation, setJobTypes, setExperienceLevels, setSalaryMin, setDatePosted]);

  const isAnyFilterActive = useMemo(() => 
    keywords !== '' || 
    location !== '' || 
    jobTypes.length > 0 || 
    experienceLevels.length > 0 || 
    salaryMin !== '' || 
    datePosted !== 'any'
  , [keywords, location, jobTypes, experienceLevels, salaryMin, datePosted]);

  return (
    <Stack gap="md">
      <TextInput
        placeholder="Mots-clés"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
      />
      <TextInput
        placeholder="Localisation"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <MultiSelect
        data={JOB_TYPE_OPTIONS}
        value={jobTypes}
        onChange={handleJobTypesChange}
        placeholder="Type de contrat"
        clearable
      />
      <MultiSelect
        data={EXPERIENCE_LEVEL_OPTIONS}
        value={experienceLevels}
        onChange={handleExperienceLevelsChange}
        placeholder="Niveau d'expérience"
        clearable
      />
      <NumberInput
        placeholder="Salaire minimum"
        value={salaryMin}
        onChange={handleSalaryMinChange}
        min={0}
        step={1000}
        suffix="€"
      />
      <Select
        data={DATE_POSTED_OPTIONS}
        value={datePosted}
        onChange={handleDatePostedChange}
        placeholder="Date de publication"
      />
      <Button onClick={handleSearch}>
        Rechercher
      </Button>
      {isAnyFilterActive && (
        <Button variant="subtle" onClick={clearFilters}>
          Réinitialiser les filtres
        </Button>
      )}
    </Stack>
  );
}); 