import React, { useState, useEffect } from 'react';
import { Container, Title, TextInput, Button, Stack, Group } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store';
import { userService } from '../services/api';
import { showNotification } from '@mantine/notifications';
import type { UserProfile } from '../types';

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
    experienceLevel: '',
    salaryExpectation: 0,
    availability: '',
    noticePeriod: 0
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
          <TextInput
            label="Niveau d'expérience"
            value={profile.experienceLevel || ''}
            onChange={(e) => setProfile({ ...profile, experienceLevel: e.target.value })}
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
          <TextInput
            label="Prétentions salariales"
            type="number"
            value={profile.salaryExpectation || 0}
            onChange={(e) => setProfile({ ...profile, salaryExpectation: Number(e.target.value) })}
          />
          <TextInput
            label="Disponibilité"
            value={profile.availability || ''}
            onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
          />
          <TextInput
            label="Préavis"
            type="number"
            value={profile.noticePeriod || 0}
            onChange={(e) => setProfile({ ...profile, noticePeriod: Number(e.target.value) })}
          />
          <Group justify="flex-end">
            <Button type="submit">Enregistrer</Button>
          </Group>
        </Stack>
      </form>
    </Container>
  );
};