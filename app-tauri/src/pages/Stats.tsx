import React from 'react';
import { Container, Title, Text, Grid, Paper, Stack } from '@mantine/core';
import { useAuth } from '@/contexts/AuthContext';

const Stats: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container size="lg">
      <Stack gap="xl">
        <Title order={1}>Statistiques</Title>
        
        <Grid>
          <Grid.Col span={4}>
            <Paper shadow="xs" p="md">
              <Title order={3} mb="md">Candidatures</Title>
              <Text size="xl" fw={700}>0</Text>
              <Text c="dimmed" size="sm">Total des candidatures</Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={4}>
            <Paper shadow="xs" p="md">
              <Title order={3} mb="md">Taux de Réponse</Title>
              <Text size="xl" fw={700}>0%</Text>
              <Text c="dimmed" size="sm">Réponses reçues</Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={4}>
            <Paper shadow="xs" p="md">
              <Title order={3} mb="md">Entretiens</Title>
              <Text size="xl" fw={700}>0</Text>
              <Text c="dimmed" size="sm">Entretiens passés</Text>
            </Paper>
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={6}>
            <Paper shadow="xs" p="md">
              <Title order={3} mb="md">Sources des Offres</Title>
              <Text c="dimmed">
                Aucune donnée disponible pour le moment.
              </Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={6}>
            <Paper shadow="xs" p="md">
              <Title order={3} mb="md">Évolution Mensuelle</Title>
              <Text c="dimmed">
                Aucune donnée disponible pour le moment.
              </Text>
            </Paper>
          </Grid.Col>
        </Grid>

        <Paper shadow="xs" p="md">
          <Title order={2} mb="md">Analyse des Compétences</Title>
          <Text c="dimmed">
            Les statistiques détaillées seront disponibles une fois que vous aurez commencé à postuler.
          </Text>
        </Paper>
      </Stack>
    </Container>
  );
};

export default Stats; 