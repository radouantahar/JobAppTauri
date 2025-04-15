import { useCallback, useState } from 'react';
import { Stack, TextInput, MultiSelect, NumberInput, Button, Group, Alert, LoadingOverlay } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAppStore } from '../store';
import type { JobType, ExperienceLevel, Filters } from '../types';

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

interface ValidationError {
  field: string;
  message: string;
}

export const SearchForm = () => {
  const { searchQuery, setSearchQuery, filters, setFilters, isLoading, error } = useAppStore();
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const validateForm = useCallback((): boolean => {
    const errors: ValidationError[] = [];

    if (filters.salaryRange.min > filters.salaryRange.max) {
      errors.push({
        field: 'salary',
        message: 'Le salaire minimum ne peut pas être supérieur au salaire maximum'
      });
    }

    if (filters.salaryRange.min < 0 || filters.salaryRange.max < 0) {
      errors.push({
        field: 'salary',
        message: 'Les salaires ne peuvent pas être négatifs'
      });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [filters.salaryRange]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // TODO: Implémenter la logique de recherche
    }
  }, [validateForm]);

  const handleSortClick = useCallback(() => {
    // TODO: Implémenter la logique de tri
  }, []);

  const getFieldError = useCallback((field: string) => {
    return validationErrors.find(error => error.field === field)?.message;
  }, [validationErrors]);

  return (
    <form role="search" onSubmit={handleSubmit}>
      <Stack gap="md" pos="relative">
        <LoadingOverlay visible={isLoading} />

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Erreur" color="red">
            {error instanceof Error ? error.message : 'Une erreur est survenue'}
          </Alert>
        )}

        {validationErrors.length > 0 && (
          <Alert icon={<IconAlertCircle size={16} />} title="Erreurs de validation" color="yellow">
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </Alert>
        )}

        <TextInput
          label="Rechercher"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-required="true"
          required
          disabled={isLoading}
        />

        <TextInput
          label="Localisation"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value } as Filters)}
          disabled={isLoading}
        />

        <fieldset role="group" aria-label="Filtres" disabled={isLoading}>
          <Stack gap="sm">
            <MultiSelect
              label="Type de contrat"
              data={JOB_TYPE_OPTIONS}
              value={filters.jobType}
              onChange={(value) => setFilters({ ...filters, jobType: value as JobType[] } as Filters)}
              clearable
            />

            <MultiSelect
              label="Niveau d'expérience"
              data={EXPERIENCE_LEVEL_OPTIONS}
              value={filters.experienceLevel}
              onChange={(value) => setFilters({ ...filters, experienceLevel: value as ExperienceLevel[] } as Filters)}
              clearable
            />

            <Group grow>
              <NumberInput
                label="Salaire minimum"
                value={filters.salaryRange.min}
                onChange={(value) => setFilters({
                  ...filters,
                  salaryRange: { ...filters.salaryRange, min: typeof value === 'number' ? value : 0 }
                } as Filters)}
                min={0}
                step={1000}
                aria-describedby="salary-min-desc"
                error={getFieldError('salary')}
              />
              <NumberInput
                label="Salaire maximum"
                value={filters.salaryRange.max}
                onChange={(value) => setFilters({
                  ...filters,
                  salaryRange: { ...filters.salaryRange, max: typeof value === 'number' ? value : 0 }
                } as Filters)}
                min={0}
                step={1000}
                aria-describedby="salary-max-desc"
                error={getFieldError('salary')}
              />
            </Group>
          </Stack>
        </fieldset>

        <Group>
          <Button 
            type="submit" 
            loading={isLoading}
            disabled={validationErrors.length > 0}
            aria-busy={isLoading}
          >
            Rechercher
          </Button>
          <Button
            variant="outline"
            onClick={handleSortClick}
            disabled={isLoading}
            aria-expanded="false"
            aria-haspopup="true"
          >
            Trier
          </Button>
        </Group>

        <div role="status" aria-live="polite">
          {isLoading ? 'Recherche en cours...' : null}
          {error ? 'Une erreur est survenue lors de la recherche.' : null}
        </div>

        <div id="salary-min-desc" className="visually-hidden">
          Entrez le salaire minimum souhaité en euros
        </div>
        <div id="salary-max-desc" className="visually-hidden">
          Entrez le salaire maximum souhaité en euros
        </div>
      </Stack>
    </form>
  );
}; 