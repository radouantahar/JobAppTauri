import React from 'react';
import { useForm } from '@mantine/form';
import { TextInput, Select, NumberInput, Textarea, Button, Group, Stack } from '@mantine/core';
import type { Job, JobType, ExperienceLevel } from '../types';

interface JobFormProps {
  onSubmit: (values: Partial<Job>) => void;
  initialValues?: Partial<Job>;
}

const jobTypes: { value: JobType; label: string }[] = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Stage', label: 'Stage' },
  { value: 'Alternance', label: 'Alternance' },
  { value: 'Freelance', label: 'Freelance' },
];

const experienceLevels: { value: ExperienceLevel; label: string }[] = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Confirmé' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Expert' },
];

export const JobForm: React.FC<JobFormProps> = ({ onSubmit, initialValues }) => {
  const form = useForm<Partial<Job>>({
    initialValues: {
      title: '',
      company: '',
      location: '',
      type: '',
      description: '',
      salary: {
        min: 0,
        max: 0,
      },
      experience: '',
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
          {...form.getInputProps('type')}
        />

        <Select
          label="Niveau d'expérience"
          data={experienceLevels}
          {...form.getInputProps('experience')}
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