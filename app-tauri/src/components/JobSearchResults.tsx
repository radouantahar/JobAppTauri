import React from 'react';
import { 
  Stack, 
  Text, 
  Card, 
  Group, 
  Badge, 
  Button, 
  Center,
  Pagination,
  Loader
} from '@mantine/core';
import { IconMapPin, IconBriefcase, IconBuilding, IconClock } from '@tabler/icons-react';
import { JobModal } from './JobModal';
import type { Job } from '../types';

interface JobSearchResultsProps {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
  onSaveJob: (job: Job) => void;
  onPageChange: (page: number) => void;
  currentPage: number;
  totalPages: number;
}

export const JobSearchResults = ({
  jobs,
  isLoading,
  error,
  onSaveJob,
  currentPage,
  totalPages,
  onPageChange
}: JobSearchResultsProps) => {
  const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <Center p="xl">
        <Loader size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center p="xl">
        <Text c="red">{error}</Text>
      </Center>
    );
  }

  if (jobs.length === 0) {
    return (
      <Center p="xl">
        <Text>Aucun résultat trouvé</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {jobs.map((job) => (
        <Card key={job.id} shadow="sm" p="lg" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="xl" fw={500}>
                {job.title}
              </Text>
              <Button
                variant="light"
                color="blue"
                onClick={() => onSaveJob(job)}
              >
                Sauvegarder
              </Button>
            </Group>

            <Group gap="xs">
              <IconBuilding size={16} />
              <Text>{job.company}</Text>
              <IconMapPin size={16} />
              <Text>{job.location}</Text>
            </Group>

            <Group gap="xs">
              <IconBriefcase size={16} />
              <Badge>{job.type}</Badge>
              <IconClock size={16} />
              <Text size="sm" c="dimmed">
                Publié {job.postedAt}
              </Text>
            </Group>

            <Group gap="xs">
              <Badge color="green">
                {job.salary.min}€ - {job.salary.max}€
              </Badge>
              <Badge color="blue">{job.experience}</Badge>
            </Group>

            <Text lineClamp={3}>{job.description}</Text>
          </Stack>
        </Card>
      ))}

      {totalPages > 1 && (
        <Center mt="xl">
          <Pagination
            value={currentPage}
            onChange={onPageChange}
            total={totalPages}
          />
        </Center>
      )}

      {selectedJobId && (
        <JobModal
          jobId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
        />
      )}
    </Stack>
  );
}; 