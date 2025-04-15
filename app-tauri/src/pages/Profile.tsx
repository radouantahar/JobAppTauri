import { memo, useMemo, useCallback, useState } from 'react';
import { Card, Stack, TextInput, Textarea, Button, Group, Text, Title, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useForm } from '@mantine/form';
import type { UserProfile } from '../types';

const DEFAULT_CV = {
  title: 'Développeur Full Stack',
  summary: 'Développeur passionné avec une expertise en React, Node.js et Python.',
  skills: ['React', 'TypeScript', 'Node.js', 'Python', 'SQL'],
  experience: [
    {
      company: 'TechCorp',
      position: 'Développeur Senior',
      period: '2020 - Présent',
      description: 'Développement d\'applications web et mobiles.'
    }
  ],
  education: [
    {
      school: 'Université Tech',
      degree: 'Master en Informatique',
      period: '2015 - 2017'
    }
  ]
};

const LOCATIONS = [
  'Paris',
  'Lyon',
  'Marseille',
  'Toulouse',
  'Bordeaux',
  'Lille',
  'Nantes',
  'Strasbourg'
];

export const ProfilePage = memo(function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UserProfile>({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      location: user?.location || '',
      cv: user?.cv || DEFAULT_CV,
      preferredJobTypes: user?.preferredJobTypes || [],
      preferredLocations: user?.preferredLocations || [],
      experienceLevel: user?.experienceLevel || 'mid',
      salaryExpectation: user?.salaryExpectation || 0,
      availability: user?.availability || 'immediate',
      noticePeriod: user?.noticePeriod || 0,
    },
    validate: {
      name: (value) => (!value ? 'Le nom est requis' : null),
      email: (value) => (!value ? 'L\'email est requis' : /^\S+@\S+$/.test(value) ? null : 'Email invalide'),
      location: (value) => (!value ? 'La localisation est requise' : null),
    },
  });

  const handleSubmit = useCallback(async (values: UserProfile) => {
    setIsLoading(true);
    setError(null);
    try {
      await updateProfile(values);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      setError('Une erreur est survenue lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  }, [updateProfile]);

  const handleLocationChange = useCallback((value: string) => {
    form.setFieldValue('location', value);
    if (!form.values.preferredLocations.includes(value)) {
      form.setFieldValue('preferredLocations', [...form.values.preferredLocations, value]);
    }
  }, [form]);

  const isFormValid = useMemo(() => 
    form.isValid() && 
    form.values.name && 
    form.values.email && 
    form.values.location
  , [form]);

  if (!user) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Accès non autorisé" color="red">
        Vous devez être connecté pour accéder à cette page.
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Title order={2}>Profil</Title>
      
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Erreur" color="red">
          {error}
        </Alert>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Card withBorder shadow="sm" radius="md">
            <Stack gap="md">
              <TextInput
                label="Nom"
                placeholder="Votre nom"
                {...form.getInputProps('name')}
                required
              />
              
              <TextInput
                label="Email"
                placeholder="Votre email"
                {...form.getInputProps('email')}
                required
              />
              
              <TextInput
                label="Localisation"
                placeholder="Votre ville"
                value={form.values.location}
                onChange={(e) => handleLocationChange(e.target.value)}
                required
              />

              <Textarea
                label="CV"
                placeholder="Décrivez votre expérience et vos compétences"
                minRows={4}
                {...form.getInputProps('cv.summary')}
              />

              <Group justify="flex-end">
                <Button 
                  type="submit" 
                  loading={isLoading}
                  disabled={!isFormValid}
                >
                  Enregistrer le profil
                </Button>
              </Group>
            </Stack>
          </Card>
        </Stack>
      </form>
    </Stack>
  );
});