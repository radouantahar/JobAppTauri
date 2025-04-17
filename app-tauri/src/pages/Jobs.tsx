import React from 'react';
import { Container, Title, Text, Grid, Paper, Stack } from '@mantine/core';

const Jobs: React.FC = () => {
  return (
    <Container size="lg">
      <Stack gap="xl">
        <Title order={1}>Mes Candidatures</Title>
        
        <Grid>
          <Grid.Col span={4}>
            <Paper shadow="xs" p="md">
              <Title order={3} mb="md">En cours</Title>
              <Text size="xl" fw={700}>0</Text>
              <Text c="dimmed" size="sm">Candidatures actives</Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={4}>
            <Paper shadow="xs" p="md">
              <Title order={3} mb="md">Entretiens</Title>
              <Text size="xl" fw={700}>0</Text>
              <Text c="dimmed" size="sm">Entretiens à venir</Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={4}>
            <Paper shadow="xs" p="md">
              <Title order={3} mb="md">Terminées</Title>
              <Text size="xl" fw={700}>0</Text>
              <Text c="dimmed" size="sm">Candidatures finalisées</Text>
            </Paper>
          </Grid.Col>
        </Grid>

        <Paper shadow="xs" p="md">
          <Title order={2} mb="md">Liste des Candidatures</Title>
          <Text c="dimmed">
            Aucune candidature pour le moment. Commencez par rechercher des offres d'emploi.
          </Text>
        </Paper>
      </Stack>
    </Container>
  );
};

export default Jobs; 