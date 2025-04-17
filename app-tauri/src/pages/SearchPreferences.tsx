import React, { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  TextInput,
  NumberInput,
  MultiSelect,
  Switch,
  Button,
  Group,
  Stack,
  Text,
  Tabs,
} from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { searchPreferencesService } from '../services/searchPreferences';
import { SearchAlerts } from '../components/SearchAlerts';

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

export function SearchPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    keywords: '',
    location: '',
    salary_min: 0,
    salary_max: 0,
    contract_types: [] as string[],
    experience_levels: [] as string[],
    remote: false,
    skills: [] as string[],
  });

  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    if (user) {
      loadPreferences();
      loadSavedFilters();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const data = await searchPreferencesService.getSearchPreferences(user!.id);
      setPreferences({
        keywords: data.keywords || '',
        location: data.location || '',
        salary_min: data.salary_min || 0,
        salary_max: data.salary_max || 0,
        contract_types: data.contract_types || [],
        experience_levels: data.experience_levels || [],
        remote: data.remote || false,
        skills: data.skills || [],
      });
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedFilters = async () => {
    try {
      const filters = await searchPreferencesService.getSavedFilters(user!.id);
      setSavedFilters(filters);
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  };

  const handleSavePreferences = async () => {
    try {
      await searchPreferencesService.updateSearchPreferences({
        id: user!.id,
        user_id: user!.id,
        ...preferences,
      });
      // Show success message
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Show error message
    }
  };

  const handleSaveFilter = async () => {
    try {
      await searchPreferencesService.saveFilter({
        id: '',
        user_id: user!.id,
        name: 'Filtre sauvegardé',
        keywords: preferences.keywords,
        location: preferences.location,
        salary_min: preferences.salary_min,
        salary_max: preferences.salary_max,
        contract_types: preferences.contract_types,
        experience_levels: preferences.experience_levels,
        remote: preferences.remote,
        skills: preferences.skills
      });
      loadSavedFilters();
      // Show success message
    } catch (error) {
      console.error('Error saving filter:', error);
      // Show error message
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <Tabs defaultValue="preferences">
      <Tabs.List>
        <Tabs.Tab value="preferences">Préférences</Tabs.Tab>
        <Tabs.Tab value="alerts">Alertes</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="preferences">
        <Paper p="xl" radius="md" withBorder>
          <Title order={2} mb="xl">
            Préférences de recherche
          </Title>

          <Stack gap="md">
            <TextInput
              label="Mots-clés"
              value={preferences.keywords}
              onChange={(e) =>
                setPreferences({ ...preferences, keywords: e.target.value })
              }
            />

            <TextInput
              label="Localisation"
              value={preferences.location}
              onChange={(e) =>
                setPreferences({ ...preferences, location: e.target.value })
              }
            />

            <Group grow>
              <NumberInput
                label="Salaire minimum"
                value={preferences.salary_min}
                onChange={(value) =>
                  setPreferences({ ...preferences, salary_min: Number(value) || 0 })
                }
              />
              <NumberInput
                label="Salaire maximum"
                value={preferences.salary_max}
                onChange={(value) =>
                  setPreferences({ ...preferences, salary_max: Number(value) || 0 })
                }
              />
            </Group>

            <MultiSelect
              label="Types de contrat"
              data={contractTypes}
              value={preferences.contract_types}
              onChange={(value) =>
                setPreferences({ ...preferences, contract_types: value })
              }
            />

            <MultiSelect
              label="Niveaux d'expérience"
              data={experienceLevels}
              value={preferences.experience_levels}
              onChange={(value) =>
                setPreferences({ ...preferences, experience_levels: value })
              }
            />

            <Switch
              label="Télétravail uniquement"
              checked={preferences.remote}
              onChange={(e) =>
                setPreferences({ ...preferences, remote: e.currentTarget.checked })
              }
            />

            <MultiSelect
              label="Compétences"
              data={preferences.skills.map((skill) => ({
                value: skill,
                label: skill,
              }))}
              value={preferences.skills}
              onChange={(value) => setPreferences({ ...preferences, skills: value })}
              searchable
              searchValue={searchValue}
              onSearchChange={(query) => {
                setSearchValue(query);
                if (query && !preferences.skills.includes(query)) {
                  setPreferences({
                    ...preferences,
                    skills: [...preferences.skills, query],
                  });
                }
              }}
            />

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={handleSaveFilter}>
                Sauvegarder comme filtre
              </Button>
              <Button onClick={handleSavePreferences}>
                Enregistrer les préférences
              </Button>
            </Group>

            {savedFilters.length > 0 && (
              <div>
                <Title order={3} mt="xl" mb="md">
                  Filtres sauvegardés
                </Title>
                {savedFilters.map((filter) => (
                  <Paper key={filter.id} p="md" mb="sm" withBorder>
                    <Text fw={500}>{filter.name}</Text>
                    <Text size="sm" c="dimmed">
                      {filter.keywords && `Mots-clés: ${filter.keywords}`}
                      {filter.location && ` | Localisation: ${filter.location}`}
                      {filter.salary_min &&
                        filter.salary_max &&
                        ` | Salaire: ${filter.salary_min} - ${filter.salary_max}`}
                    </Text>
                  </Paper>
                ))}
              </div>
            )}
          </Stack>
        </Paper>
      </Tabs.Panel>

      <Tabs.Panel value="alerts">
        <SearchAlerts />
      </Tabs.Panel>
    </Tabs>
  );
} 