import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useJobStats } from '../hooks/useJobStats';
import { useApplicationStats } from '../hooks/useApplicationStats';
import { Container, Grid, Paper, Title, Text, Group, Stack, Card, useMantineTheme, Button } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useAppStore } from '../store';
import type { Job, JobStats, ApplicationStats } from '../types';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { stats: jobStats, loading: jobStatsLoading, error: jobStatsError, refreshStats: refreshJobStats } = useJobStats();
  const { stats: appStats, loading: appStatsLoading, error: appStatsError, refreshStats: refreshAppStats } = useApplicationStats();
  const theme = useMantineTheme();
  const { setLoading, isRefreshing, setIsRefreshing } = useAppStore();
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000; // 5 seconds

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshJobStats();
    refreshAppStats();
    setIsRefreshing(false);
  };

  const isLoading = jobStatsLoading || appStatsLoading;
  const hasError = jobStatsError || appStatsError;

  if (isLoading) {
    return (
      <Stack gap="md" align="center" justify="center" h="100vh">
        <Text>Chargement des statistiques...</Text>
      </Stack>
    );
  }

  if (hasError) {
    return (
      <Stack gap="md" align="center" justify="center" h="100vh">
        <Text color="red">Erreur lors du chargement des statistiques</Text>
        <Button onClick={handleRefresh} leftSection={<IconRefresh size={16} />}>
          Réessayer
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={2}>Tableau de bord</Title>
        <Button
          variant="light"
          leftSection={<IconRefresh size={16} />}
          onClick={handleRefresh}
          loading={isRefreshing}
        >
          Actualiser
        </Button>
      </Group>

      <Grid>
        {/* Statistiques des offres */}
        <Grid.Col span={12}>
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Title order={3}>Statistiques des offres</Title>
            </Group>
            <Grid>
              <Grid.Col span={4}>
                <Paper p="md" withBorder>
                  <Text size="sm" c="dimmed">Total des offres</Text>
                  <Title order={2}>{jobStats?.totalJobs || 0}</Title>
                </Paper>
              </Grid.Col>
              <Grid.Col span={8}>
                <Paper p="md" withBorder>
                  <Text size="sm" c="dimmed" mb="md">Évolution des offres</Text>
                  <Group justify="space-between">
                    {jobStats?.trendData.labels.map((label, index) => (
                      <Stack key={label} gap={0} align="center">
                        <Text size="xs">{label}</Text>
                        <Text fw={500}>{jobStats.trendData.values[index]}</Text>
                      </Stack>
                    ))}
                  </Group>
                </Paper>
              </Grid.Col>
            </Grid>
          </Card>
        </Grid.Col>

        {/* Statistiques des candidatures */}
        <Grid.Col span={12}>
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Title order={3}>Statistiques des candidatures</Title>
            </Group>
            <Grid>
              <Grid.Col span={4}>
                <Paper p="md" withBorder>
                  <Text size="sm" c="dimmed">Total des candidatures</Text>
                  <Title order={2}>{appStats?.totalApplications || 0}</Title>
                </Paper>
              </Grid.Col>
              <Grid.Col span={4}>
                <Paper p="md" withBorder>
                  <Text size="sm" c="dimmed">Taux de réponse</Text>
                  <Title order={2}>{appStats?.responseRate || 0}%</Title>
                </Paper>
              </Grid.Col>
              <Grid.Col span={4}>
                <Paper p="md" withBorder>
                  <Text size="sm" c="dimmed">Temps moyen de réponse</Text>
                  <Title order={2}>{appStats?.averageResponseTime || 0}j</Title>
                </Paper>
              </Grid.Col>
            </Grid>
          </Card>
        </Grid.Col>

        {/* Distribution des sources */}
        <Grid.Col span={12}>
          <Card withBorder>
            <Title order={3} mb="md">Distribution des sources</Title>
            <Grid>
              {jobStats?.sourceDistribution.labels.map((label, index) => (
                <Grid.Col key={label} span={3}>
                  <Paper p="md" withBorder>
                    <Text size="sm" c="dimmed">{label}</Text>
                    <Title order={2}>{jobStats.sourceDistribution.values[index]}%</Title>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}