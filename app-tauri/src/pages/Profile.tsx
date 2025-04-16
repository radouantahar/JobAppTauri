import React, { useState, useEffect } from 'react';
import { Container, Title, TextInput, Button, Stack, Group, Select, NumberInput } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store';
import { userService } from '../services/api';
import { showNotification } from '@mantine/notifications';
import type { UserProfile, ExperienceLevel } from '../types';

const experienceLevels: { value: ExperienceLevel; label: string }[] = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Confirmé' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Expert' },
];

export const Profile = () => {
  const { user } = useAuth();
  const { setLoading } = useAppStore();
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    email: '',
    location: '',
    cv: '',
    preferredJobTypes: [],
    preferredLocations: [],
    experienceLevel: undefined,
    salaryExpectation: {
      min: 0,
      max: 0
    },
    availability: '',
    noticePeriod: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await userService.getUserProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userService.updateUserProfile(profile);
      showNotification({
        title: 'Succès',
        message: 'Profil mis à jour avec succès',
        color: 'green',
      });
    } catch (error) {
      showNotification({
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la mise à jour du profil',
        color: 'red',
      });
    }
  };

  return (
    <Container size="md" py="xl">
      <Title order={2} mb="xl">Mon Profil</Title>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Nom"
            value={profile.name || ''}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
          <TextInput
            label="Email"
            value={profile.email || ''}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
          <TextInput
            label="Localisation"
            value={profile.location || ''}
            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
          />
          <TextInput
            label="CV"
            value={profile.cv || ''}
            onChange={(e) => setProfile({ ...profile, cv: e.target.value })}
          />
          <Select
            label="Niveau d'expérience"
            value={profile.experienceLevel}
            onChange={(value) => setProfile({ ...profile, experienceLevel: value as ExperienceLevel })}
            data={experienceLevels}
          />
          <TextInput
            label="Types de postes préférés"
            value={profile.preferredJobTypes?.join(', ') || ''}
            onChange={(e) => setProfile({ ...profile, preferredJobTypes: e.target.value.split(',').map(s => s.trim()) })}
          />
          <TextInput
            label="Localisations préférées"
            value={profile.preferredLocations?.join(', ') || ''}
            onChange={(e) => setProfile({ ...profile, preferredLocations: e.target.value.split(',').map(s => s.trim()) })}
          />
          <Group grow>
            <NumberInput
              label="Salaire minimum"
              value={profile.salaryExpectation?.min || 0}
              onChange={(value) => setProfile({
                ...profile,
                salaryExpectation: {
                  min: typeof value === 'number' ? value : 0,
                  max: profile.salaryExpectation?.max || 0
                }
              })}
            />
            <NumberInput
              label="Salaire maximum"
              value={profile.salaryExpectation?.max || 0}
              onChange={(value) => setProfile({
                ...profile,
                salaryExpectation: {
                  min: profile.salaryExpectation?.min || 0,
                  max: typeof value === 'number' ? value : 0
                }
              })}
            />
          </Group>
          <TextInput
            label="Disponibilité"
            value={profile.availability || ''}
            onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
          />
          <TextInput
            label="Préavis"
            value={profile.noticePeriod || ''}
            onChange={(e) => setProfile({ ...profile, noticePeriod: e.target.value })}
          />
          <Group justify="flex-end">
            <Button type="submit">Enregistrer</Button>
          </Group>
        </Stack>
      </form>
    </Container>
  );
};