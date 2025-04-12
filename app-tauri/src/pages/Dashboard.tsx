import { useEffect, useState } from 'react';
import { Container, Grid, Paper, Title, Text, Group, RingProgress, SimpleGrid, Card, useMantineTheme } from '@mantine/core';
import { IconBriefcase, IconCheck, IconClock, IconX } from '@tabler/icons-react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartTitle, Tooltip, Legend, ArcElement } from 'chart.js';
import { useAppStore } from '../store';
import { statsService, jobService } from '../services/api';
import { Job } from '../types';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend, ArcElement);

export function Dashboard() {
  const theme = useMantineTheme();
  const { setLoading } = useAppStore();
  const [jobStats, setJobStats] = useState<any>(null);
  const [applicationStats, setApplicationStats] = useState<any>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [jobStatsData, applicationStatsData, recentJobsData] = await Promise.all([
          statsService.getJobStats(),
          statsService.getApplicationStats(),
          jobService.searchJobs({ keywords: [], datePosted: 'last_week' })
        ]);
        
        setJobStats(jobStatsData);
        setApplicationStats(applicationStatsData);
        setRecentJobs(recentJobsData.slice(0, 5));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [setLoading]);

  // Chart data
  const jobTrendData = {
    labels: jobStats?.trendData?.labels || [],
    datasets: [
      {
        label: 'Offres trouvées',
        data: jobStats?.trendData?.values || [],
        borderColor: theme.colors.blue[6],
        backgroundColor: theme.colors.blue[2],
        tension: 0.3,
      },
    ],
  };

  const sourceDistributionData = {
    labels: jobStats?.sourceDistribution?.labels || [],
    datasets: [
      {
        data: jobStats?.sourceDistribution?.values || [],
        backgroundColor: [
          theme.colors.blue[6],
          theme.colors.green[6],
          theme.colors.yellow[6],
          theme.colors.orange[6],
          theme.colors.red[6],
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Tableau de bord</Title>
      
      {/* Main stats */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="xl">
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed">Total des offres</Text>
              <Text fw={700} size="xl">{jobStats?.totalJobs || 0}</Text>
            </div>
            <IconBriefcase size={32} color={theme.colors.blue[6]} />
          </Group>
        </Card>
        
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed">Candidatures envoyées</Text>
              <Text fw={700} size="xl">{applicationStats?.totalApplications || 0}</Text>
            </div>
            <IconCheck size={32} color={theme.colors.green[6]} />
          </Group>
        </Card>
        
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed">Entretiens</Text>
              <Text fw={700} size="xl">{applicationStats?.totalInterviews || 0}</Text>
            </div>
            <IconClock size={32} color={theme.colors.yellow[6]} />
          </Group>
        </Card>
        
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed">Offres reçues</Text>
              <Text fw={700} size="xl">{applicationStats?.totalOffers || 0}</Text>
            </div>
            <IconX size={32} color={theme.colors.red[6]} />
          </Group>
        </Card>
      </SimpleGrid>
      
      <Grid gutter="md">
        {/* Job trend chart */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper shadow="sm" p="md" radius="md" withBorder>
            <Title order={3} mb="md">Évolution des offres</Title>
            <Line data={jobTrendData} options={chartOptions} />
          </Paper>
        </Grid.Col>
        
        {/* Success rate */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="sm" p="md" radius="md" withBorder>
            <Title order={3} mb="md">Taux de réussite</Title>
            <Group justify="center">
              <RingProgress
                size={180}
                thickness={16}
                sections={[
                  { value: applicationStats?.successRate || 0, color: theme.colors.green[6] },
                ]}
                label={
                  <Text size="xl" ta="center" fw={700}>
                    {applicationStats?.successRate || 0}%
                  </Text>
                }
              />
            </Group>
            <Text ta="center" size="sm" c="dimmed" mt="sm">
              Taux de réponses positives
            </Text>
          </Paper>
        </Grid.Col>
        
        {/* Source distribution */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="sm" p="md" radius="md" withBorder>
            <Title order={3} mb="md">Répartition par source</Title>
            <Pie data={sourceDistributionData} />
          </Paper>
        </Grid.Col>
        
        {/* Recent jobs */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="sm" p="md" radius="md" withBorder>
            <Title order={3} mb="md">Offres récentes</Title>
            {recentJobs.length > 0 ? (
              recentJobs.map((job) => (
                <Group key={job.id} justify="space-between" mb="xs">
                  <div>
                    <Text fw={500}>{job.title}</Text>
                    <Text size="xs" c="dimmed">{job.company}</Text>
                  </div>
                  <Text size="sm">{new Date(job.publishedAt).toLocaleDateString()}</Text>
                </Group>
              ))
            ) : (
              <Text c="dimmed">Aucune offre récente</Text>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}