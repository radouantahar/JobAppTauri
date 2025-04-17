import React, { useState, useEffect } from 'react';
import { Paper, Title, Text, Button, Group, Stack, Select, Switch } from '@mantine/core';
import { IconBell, IconTrash } from '@tabler/icons-react';
import { searchPreferencesService } from '../services/searchPreferences';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';

interface SearchAlert {
  id: string;
  user_id: string;
  filter_id: string;
  frequency: string;
  last_notification?: string;
  is_active: boolean;
}

export function SearchAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SearchAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user]);

  const loadAlerts = async () => {
    try {
      const data = await searchPreferencesService.getSearchAlerts(user!.id);
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les alertes',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      await searchPreferencesService.toggleSearchAlert(alertId, isActive);
      await loadAlerts();
      notifications.show({
        title: 'Succès',
        message: `Alerte ${isActive ? 'activée' : 'désactivée'} avec succès`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating alert:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de mettre à jour l\'alerte',
        color: 'red',
      });
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await searchPreferencesService.deleteSearchAlert(alertId);
      await loadAlerts();
      notifications.show({
        title: 'Succès',
        message: 'Alerte supprimée avec succès',
        color: 'green',
      });
    } catch (error) {
      console.error('Error deleting alert:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de supprimer l\'alerte',
        color: 'red',
      });
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <Paper p="xl" radius="md" withBorder>
      <Title order={2} mb="xl">
        Alertes de recherche
      </Title>

      <Stack gap="md">
        {alerts.length === 0 ? (
          <Text c="dimmed">Aucune alerte configurée</Text>
        ) : (
          alerts.map((alert) => (
            <Paper key={alert.id} p="md" withBorder>
              <Group justify="space-between">
                <Stack gap="xs">
                  <Text fw={500}>Fréquence: {alert.frequency}</Text>
                  <Text size="sm" c="dimmed">
                    Dernière notification: {alert.last_notification || 'Jamais'}
                  </Text>
                </Stack>
                <Group>
                  <Switch
                    checked={alert.is_active}
                    onChange={(event) => handleToggleAlert(alert.id, event.currentTarget.checked)}
                  />
                  <Button
                    variant="subtle"
                    color="red"
                    onClick={() => handleDeleteAlert(alert.id)}
                  >
                    <IconTrash size={16} />
                  </Button>
                </Group>
              </Group>
            </Paper>
          ))
        )}
      </Stack>
    </Paper>
  );
} 