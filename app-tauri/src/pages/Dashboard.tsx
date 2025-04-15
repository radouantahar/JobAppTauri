import { Container, Title, Text, SimpleGrid, Card, Group, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useMemo } from 'react';
import { useAppStore } from '../store';
import type { Application } from '../types';
import classes from './Dashboard.module.css';

const Dashboard = () => {
  const { applications } = useAppStore();

  const stats = useMemo(() => ({
    total: applications.length,
    inProgress: applications.filter((app: Application) => app.status === 'in_progress').length,
    interviews: applications.filter((app: Application) => app.status === 'interview').length,
    offers: applications.filter((app: Application) => app.status === 'offer').length,
    rejected: applications.filter((app: Application) => app.status === 'rejected').length
  }), [applications]);

  return (
    <Container size="xl" className={classes.container}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Tableau de bord</Title>
          <Text c="dimmed" mt="xs">
            Suivez vos candidatures et vos statistiques
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          variant="filled"
          component="a"
          href="/applications/new"
        >
          Nouvelle candidature
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="md">
        <Card withBorder padding="lg" radius="md">
          <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
            Total
          </Text>
          <Text fz="xl" fw={500} mt="md">
            {stats.total}
          </Text>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
            En cours
          </Text>
          <Text fz="xl" fw={500} mt="md">
            {stats.inProgress}
          </Text>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
            Entretiens
          </Text>
          <Text fz="xl" fw={500} mt="md">
            {stats.interviews}
          </Text>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
            Offres
          </Text>
          <Text fz="xl" fw={500} mt="md">
            {stats.offers}
          </Text>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
            Rejetées
          </Text>
          <Text fz="xl" fw={500} mt="md">
            {stats.rejected}
          </Text>
        </Card>
      </SimpleGrid>
    </Container>
  );
};

export default Dashboard;