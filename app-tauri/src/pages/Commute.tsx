// pages/Commute.tsx
import { useState, useEffect } from 'react';
import { Container, Card, Title, Text, SimpleGrid, Group, Badge, Select } from '@mantine/core';
import { IconMapPin, IconClock, IconCar, IconBus, IconBike } from '@tabler/icons-react';
import { jobService } from '../services/api';
import { useAppStore } from '../store';
import type { Job } from '../types';

export function CommutePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [transportMode, setTransportMode] = useState<'driving' | 'transit' | 'bicycling'>('driving');
  const { setLoading } = useAppStore();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const results = await jobService.searchJobs({
        keywords: [],
        datePosted: 'month'
        // Removed the 'limit' parameter as it's not in SearchCriteria
      });
      setJobs(results.slice(0, 6)); // Limit results client-side instead
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="xl">Commute Analysis</Title>
      
      <Group justify="space-between" mb="md">
        <Text c="dimmed">Compare travel times from your locations</Text>
        <Select
          value={transportMode}
          onChange={(value) => setTransportMode(value as any)}
          data={[
            { value: 'driving', label: 'Driving' },
            { value: 'transit', label: 'Public Transport' },
            { value: 'bicycling', label: 'Bicycling' },
          ]}
          style={{ width: 200 }}
        />
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {jobs.map((job) => (
          <Card key={job.id} shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={500}>{job.title}</Text>
              <Badge color="blue" variant="light">{job.company}</Badge>
            </Group>

            <Group gap="xs" mb="md">
              <IconMapPin size={16} />
              <Text size="sm">{job.location}</Text>
            </Group>

            <Card withBorder p="sm" mb="sm">
              <Group justify="space-between">
                <Group gap="xs">
                  <IconClock size={16} />
                  <Text>Primary Home</Text>
                </Group>
                <Badge 
                  leftSection={transportMode === 'driving' ? <IconCar size={12} /> : 
                              transportMode === 'transit' ? <IconBus size={12} /> : 
                              <IconBike size={12} />}
                >
                  {job.commuteTimes?.primaryHome?.duration} min
                </Badge>
              </Group>
            </Card>

            {job.commuteTimes?.secondaryHome && (
              <Card withBorder p="sm">
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconClock size={16} />
                    <Text>Secondary Home</Text>
                  </Group>
                  <Badge 
                    leftSection={transportMode === 'driving' ? <IconCar size={12} /> : 
                                transportMode === 'transit' ? <IconBus size={12} /> : 
                                <IconBike size={12} />}
                  >
                    {job.commuteTimes.secondaryHome.duration} min
                  </Badge>
                </Group>
              </Card>
            )}
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}