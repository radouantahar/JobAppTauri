import React, { useState, useEffect } from 'react';
import { Container, Title, TextInput, Button, Stack, Group, Select, NumberInput } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store';
import { userService } from '../services/api';
import { showNotification } from '@mantine/notifications';
import type { UserProfile, ExperienceLevel } from '../types';

const experienceLevels = [
  { value: 'junior' as ExperienceLevel, label: 'Débutant' },
  { value: 'mid' as ExperienceLevel, label: 'Intermédiaire' },
  { value: 'senior' as ExperienceLevel, label: 'Senior' },
  { value: 'expert' as ExperienceLevel, label: 'Expert' }
];

export const Profile = () => {
  const { user } = useAuth();
  const { setLoading } = useAppStore();
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    email: '',
    location: '',
    title: '',
    bio: '',
    experience: '',
    preferredJobTypes: [],
    preferredLocations: [],
    salaryExpectation: {
      min: 0,
      max: 0,
      currency: 'EUR',
      period: 'year'
    },
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

  const handleSalaryMinChange = (value: string | number) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    setProfile(prev => ({
      ...prev,
      salaryExpectation: {
        min: numericValue,
        max: prev.salaryExpectation?.max || 0,
        currency: prev.salaryExpectation?.currency || 'EUR',
        period: prev.salaryExpectation?.period || 'year'
      }
    }));
  };

  const handleSalaryMaxChange = (value: string | number) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    setProfile(prev => ({
      ...prev,
      salaryExpectation: {
        min: prev.salaryExpectation?.min || 0,
        max: numericValue,
        currency: prev.salaryExpectation?.currency || 'EUR',
        period: prev.salaryExpectation?.period || 'year'
      }
    }));
  };

  const handleNoticePeriodChange = (value: string | number) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    setProfile(prev => ({
      ...prev,
      noticePeriod: numericValue
    }));
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
            label="Titre"
            value={profile.title || ''}
            onChange={(e) => setProfile({ ...profile, title: e.target.value })}
          />
          <TextInput
            label="Bio"
            value={profile.bio || ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          />
          <Select
            label="Niveau d'expérience"
            value={profile.experience}
            onChange={(value) => setProfile({ ...profile, experience: value as ExperienceLevel })}
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
              value={profile.salaryExpectation?.min}
              onChange={handleSalaryMinChange}
              min={0}
              step={1000}
              hideControls
              allowDecimal={false}
            />
            <NumberInput
              label="Salaire maximum"
              value={profile.salaryExpectation?.max}
              onChange={handleSalaryMaxChange}
              min={0}
              step={1000}
              hideControls
              allowDecimal={false}
            />
          </Group>
          <TextInput
            label="Disponibilité"
            value={profile.availability || ''}
            onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
          />
          <NumberInput
            label="Préavis (en jours)"
            value={profile.noticePeriod}
            onChange={handleNoticePeriodChange}
            min={0}
            step={1}
            hideControls
            allowDecimal={false}
          />
          <Group justify="flex-end">
            <Button type="submit">Enregistrer</Button>
          </Group>
        </Stack>
      </form>
    </Container>
  );
};

export default Profile;