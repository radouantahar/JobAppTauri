import { useState } from 'react';
import { Stack, TextInput, Textarea, Button, Group, NumberInput, Select } from '@mantine/core';
import type { Job, JobType, ExperienceLevel, SalaryRange } from '../types';

interface JobFormProps {
  jobId?: string;
  initialData?: Partial<Job>;
  onSubmit: (data: Partial<Job>) => Promise<void>;
  onClose?: () => void;
  isLoading?: boolean;
}

const JOB_TYPES: JobType[] = ['full-time', 'part-time', 'contract', 'internship', 'temporary'];
const EXPERIENCE_LEVELS: ExperienceLevel[] = ['entry', 'mid', 'senior', 'lead', 'executive'];

const DEFAULT_SALARY: SalaryRange = {
  min: 0,
  max: 0,
  currency: 'EUR',
  period: 'year'
};

export const JobForm = ({ initialData, onSubmit, onClose, isLoading }: JobFormProps) => {
  const [formData, setFormData] = useState<Partial<Job>>({
    title: initialData?.title || '',
    company: initialData?.company || '',
    location: initialData?.location || '',
    description: initialData?.description || '',
    url: initialData?.url || '',
    jobType: initialData?.jobType || 'full-time',
    experienceLevel: initialData?.experienceLevel || 'mid',
    salary: initialData?.salary || DEFAULT_SALARY,
    skills: initialData?.skills || []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleSalaryChange = (field: keyof SalaryRange) => (value: number | string | null) => {
    const numValue = typeof value === 'number' ? value : 0;
    setFormData({
      ...formData,
      salary: {
        ...formData.salary,
        [field]: numValue
      } as SalaryRange
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Titre"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <TextInput
          label="Entreprise"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          required
        />
        <TextInput
          label="Localisation"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
        />
        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          minRows={3}
          required
        />
        <TextInput
          label="URL"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          required
        />
        <Select
          label="Type de contrat"
          value={formData.jobType}
          onChange={(value) => value && setFormData({ ...formData, jobType: value as JobType })}
          data={JOB_TYPES.map(type => ({ value: type, label: type }))}
          required
        />
        <Select
          label="Niveau d'expérience"
          value={formData.experienceLevel}
          onChange={(value) => value && setFormData({ ...formData, experienceLevel: value as ExperienceLevel })}
          data={EXPERIENCE_LEVELS.map(level => ({ value: level, label: level }))}
          required
        />
        <Group grow>
          <NumberInput
            label="Salaire minimum"
            value={formData.salary?.min}
            onChange={handleSalaryChange('min')}
            min={0}
          />
          <NumberInput
            label="Salaire maximum"
            value={formData.salary?.max}
            onChange={handleSalaryChange('max')}
            min={0}
          />
        </Group>
        <Group justify="flex-end">
          {onClose && (
            <Button variant="light" onClick={onClose}>
              Annuler
            </Button>
          )}
          <Button type="submit" loading={isLoading}>
            Enregistrer
          </Button>
        </Group>
      </Stack>
    </form>
  );
}; 