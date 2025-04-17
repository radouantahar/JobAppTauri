import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Grid,
  Card,
  Text,
  Group,
  Stack,
  Select,
  RingProgress,
  Center,
  Paper,
} from '@mantine/core';
import { IconChartBar, IconFileText, IconBriefcase } from '@tabler/icons-react';
import { DashboardStats, StatsTimeRange } from '../types/statistics';
import { useTauri } from '../hooks/useTauri';

const TIME_RANGES: { value: StatsTimeRange; label: string }[] = [
  { value: 'day', label: 'Aujourd\'hui' },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'quarter', label: 'Ce trimestre' },
  { value: 'year', label: 'Cette année' },
  { value: 'all', label: 'Tout' },
];

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeRange, setTimeRange] = useState<StatsTimeRange>('month');
  const { invoke } = useTauri();

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    try {
      const response = await invoke<DashboardStats>('get_dashboard_stats', {
        timeRange,
      });
      setStats(response);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  if (!stats) {
    return (
      <Container size="xl" py="xl">
        <Title order={2}>Tableau de Bord</Title>
        <Text>Chargement des statistiques...</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Tableau de Bord</Title>
        <Select
          value={timeRange}
          onChange={(value) => setTimeRange(value as StatsTimeRange)}
          data={TIME_RANGES}
          style={{ width: 200 }}
        />
      </Group>

      <Grid>
        {/* Applications */}
        <Grid.Col span={4}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group mb="md">
              <IconBriefcase size={24} />
              <Text fw={500}>Candidatures</Text>
            </Group>
            <Stack gap="md">
              <Group justify="space-between">
                <Text>Total</Text>
                <Text fw={500}>{stats.applications.totalApplications}</Text>
              </Group>
              <Group justify="space-between">
                <Text>Entretiens</Text>
                <Text fw={500}>{stats.applications.totalInterviews}</Text>
              </Group>
              <Group justify="space-between">
                <Text>Offres</Text>
                <Text fw={500}>{stats.applications.totalOffers}</Text>
              </Group>
              <Paper p="md" radius="md" withBorder>
                <Center>
                  <RingProgress
                    size={120}
                    thickness={12}
                    sections={[
                      { value: stats.applications.successRate, color: 'blue' },
                    ]}
                    label={
                      <Text ta="center" size="xs">
                        Taux de succès
                      </Text>
                    }
                  />
                </Center>
              </Paper>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Jobs */}
        <Grid.Col span={4}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group mb="md">
              <IconChartBar size={24} />
              <Text fw={500}>Offres d'Emploi</Text>
            </Group>
            <Stack gap="md">
              <Group justify="space-between">
                <Text>Total</Text>
                <Text fw={500}>{stats.jobs.totalJobs}</Text>
              </Group>
              <Group justify="space-between">
                <Text>Actives</Text>
                <Text fw={500}>{stats.jobs.activeJobs}</Text>
              </Group>
              <Group justify="space-between">
                <Text>Archivées</Text>
                <Text fw={500}>{stats.jobs.archivedJobs}</Text>
              </Group>
              <Paper p="md" radius="md" withBorder>
                <Text size="sm" mb="xs">Distribution par source</Text>
                {stats.jobs.sourceDistribution.labels.map((label, index) => (
                  <Group key={label} justify="space-between" mb="xs">
                    <Text size="sm">{label}</Text>
                    <Text size="sm" fw={500}>
                      {stats.jobs.sourceDistribution.values[index]}
                    </Text>
                  </Group>
                ))}
              </Paper>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Documents */}
        <Grid.Col span={4}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group mb="md">
              <IconFileText size={24} />
              <Text fw={500}>Documents</Text>
            </Group>
            <Stack gap="md">
              <Group justify="space-between">
                <Text>Total</Text>
                <Text fw={500}>{stats.documents.totalDocuments}</Text>
              </Group>
              <Paper p="md" radius="md" withBorder>
                <Text size="sm" mb="xs">Par type</Text>
                {Object.entries(stats.documents.byType).map(([type, count]) => (
                  <Group key={type} justify="space-between" mb="xs">
                    <Text size="sm">{type}</Text>
                    <Text size="sm" fw={500}>{count}</Text>
                  </Group>
                ))}
              </Paper>
              <Paper p="md" radius="md" withBorder>
                <Text size="sm" mb="xs">Utilisation du stockage</Text>
                <Text size="sm">
                  {Math.round(stats.documents.storageUsage.total / 1024 / 1024)} MB
                </Text>
              </Paper>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}; 