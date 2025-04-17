// pages/Commute.tsx
import React from 'react';
import { Container, Title, Text, Paper, Stack } from '@mantine/core';
import { useAuth } from '@/contexts/AuthContext';

const Commute: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container size="lg">
      <Stack gap="xl">
        <Title order={1}>Temps de Trajet</Title>
        
        <Paper shadow="xs" p="md">
          <Title order={2} mb="md">Calcul des Trajets</Title>
          <Text>
            Cette fonctionnalité vous permettra de :
          </Text>
          <ul>
            <li>Calculer les temps de trajet vers les lieux de travail</li>
            <li>Comparer les différents modes de transport</li>
            <li>Visualiser les trajets sur une carte</li>
            <li>Estimer les coûts de transport</li>
          </ul>
          <Text mt="md" c="dimmed">
            Fonctionnalité en cours de développement. Disponible prochainement.
          </Text>
        </Paper>

        <Paper shadow="xs" p="md">
          <Title order={2} mb="md">Préférences de Transport</Title>
          <Text c="dimmed">
            Configurez vos préférences de transport une fois la fonctionnalité disponible.
          </Text>
        </Paper>
      </Stack>
    </Container>
  );
};

export default Commute;