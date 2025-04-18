import React from 'react';
import { Container, Stack, Title } from '@mantine/core';
import StatisticsDashboard from '../components/StatisticsDashboard';

const Dashboard: React.FC = () => {
  return (
    <Container size="xl">
      <Stack gap="md">
        <Title order={1}>Tableau de bord</Title>
        <StatisticsDashboard />
      </Stack>
    </Container>
  );
};

export default Dashboard;