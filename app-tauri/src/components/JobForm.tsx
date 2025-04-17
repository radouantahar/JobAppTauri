import React from 'react';
import { useForm } from '@mantine/form';
import { TextInput, Select, NumberInput, Textarea, Button, Group, Stack } from '@mantine/core';
import type { Job, JobType, ExperienceLevel, SalaryRange } from '../types/index';

/**
 * Props pour le composant JobForm
 */
interface JobFormProps {
  /** Fonction appelée lors de la soumission du formulaire */
  onSubmit: (values: Partial<Job>) => void;
  /** Valeurs initiales du formulaire */
  initialValues?: Partial<Job>;
}

/**
 * Options pour les types de contrats
 */
const jobTypes: { value: JobType; label: string }[] = [
  { value: 'full-time', label: 'CDI' },
  { value: 'part-time', label: 'CDD' },
  { value: 'internship', label: 'Stage' },
  { value: 'contract', label: 'Freelance' },
  { value: 'temporary', label: 'Intérim' },
];

/**
 * Options pour les niveaux d'expérience
 */
const experienceLevels: { value: ExperienceLevel; label: string }[] = [
  { value: 'entry', label: 'Débutant' },
  { value: 'mid', label: 'Confirmé' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Expert' },
  { value: 'executive', label: 'Directeur' },
];

/**
 * Composant de formulaire pour la création et l'édition d'une offre d'emploi
 * @param props - Les propriétés du composant
 * @returns Le composant de formulaire
 */
export const JobForm: React.FC<JobFormProps> = ({ onSubmit, initialValues }) => {
  const form = useForm<Partial<Job>>({
    initialValues: {
      title: '',
      company: '',
      location: '',
      jobType: 'full-time',
      description: '',
      salary: {
        min: 0,
        max: 0,
        currency: 'EUR',
        period: 'year',
      } as SalaryRange,
      experienceLevel: 'entry',
      ...initialValues,
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput
          label="Titre"
          placeholder="Développeur Full Stack"
          {...form.getInputProps('title')}
        />

        <TextInput
          label="Entreprise"
          placeholder="Nom de l'entreprise"
          {...form.getInputProps('company')}
        />

        <TextInput
          label="Localisation"
          placeholder="Paris, Lyon, Remote..."
          {...form.getInputProps('location')}
        />

        <Select
          label="Type de contrat"
          data={jobTypes}
          {...form.getInputProps('jobType')}
        />

        <Select
          label="Niveau d'expérience"
          data={experienceLevels}
          {...form.getInputProps('experienceLevel')}
        />

        <Group grow>
          <NumberInput
            label="Salaire minimum"
            placeholder="30000"
            {...form.getInputProps('salary.min')}
          />
          <NumberInput
            label="Salaire maximum"
            placeholder="60000"
            {...form.getInputProps('salary.max')}
          />
        </Group>

        <Textarea
          label="Description"
          placeholder="Description du poste..."
          minRows={4}
          {...form.getInputProps('description')}
        />

        <Button type="submit" mt="md">
          Enregistrer
        </Button>
      </Stack>
    </form>
  );
}; 