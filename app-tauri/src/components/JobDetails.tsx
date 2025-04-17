import { memo, useCallback, useMemo } from 'react';
import { Card, Text, Group, Badge, Button, Stack, ActionIcon } from '@mantine/core';
import { IconHeart, IconShare } from '@tabler/icons-react';
import { useAppStore } from '../store';
import type { Job } from '../types/job';
import classes from './JobDetails.module.css';

interface JobDetailsProps {
  job: Job;
  onApply?: (job: Job) => void;
  onShare?: (job: Job) => void;
}

export const JobDetails = memo(function JobDetails({ job, onApply, onShare }: JobDetailsProps) {
  const { addFavorite, removeFavorite, favorites } = useAppStore();

  const isFavorite = useMemo(() => favorites.includes(job.id), [favorites, job.id]);

  const handleFavoriteClick = async () => {
    try {
      if (isFavorite) {
        removeFavorite(job.id);
      } else {
        addFavorite(job.id);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleShareClick = useCallback(() => {
    onShare?.(job);
  }, [job, onShare]);

  const handleApplyClick = useCallback(() => {
    onApply?.(job);
  }, [job, onApply]);

  return (
    <Card className={classes.card}>
      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap">
          <Stack gap="xs">
            <Text size="xl" fw={700}>
              {job.title}
            </Text>
            <Text size="lg" c="dimmed">
              {job.company}
            </Text>
          </Stack>
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              color={isFavorite ? 'red' : 'gray'}
              onClick={handleFavoriteClick}
              size="lg"
            >
              <IconHeart size={24} />
            </ActionIcon>
            <ActionIcon variant="subtle" onClick={handleShareClick} size="lg">
              <IconShare size={24} />
            </ActionIcon>
          </Group>
        </Group>

        <Group gap="xs">
          <Badge size="lg">{job.jobType}</Badge>
          <Badge size="lg">{job.experienceLevel}</Badge>
          <Badge size="lg">{job.location}</Badge>
        </Group>

        {job.salary && (
          <Text size="lg" fw={500}>
            {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()} {job.salary.currency}/{job.salary.period}
          </Text>
        )}

        <Text className={classes.description}>{job.description}</Text>

        {job.skills && job.skills.length > 0 && (
          <Stack gap="xs">
            <Text fw={500}>Compétences requises</Text>
            <Group gap="xs">
              {job.skills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </Group>
          </Stack>
        )}

        <Button
          size="lg"
          fullWidth
          onClick={handleApplyClick}
          className={classes.applyButton}
        >
          Postuler maintenant
        </Button>
      </Stack>
    </Card>
  );
}); 