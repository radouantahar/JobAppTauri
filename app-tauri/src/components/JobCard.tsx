import { memo, useMemo } from 'react';
import { Card, Text, Group, Badge, ActionIcon, Stack } from '@mantine/core';
import { IconHeart, IconShare } from '@tabler/icons-react';
import { useAppStore } from '../store';
import type { Job } from '../types';
import classes from './JobCard.module.css';

interface JobCardProps {
  job: Job;
  onClick?: (job: Job) => void;
  onShareClick?: (job: Job) => void;
}

export const JobCard = memo(function JobCard({ job, onClick, onShareClick }: JobCardProps) {
  const { addFavorite, removeFavorite, favorites } = useAppStore();
  
  const isFavorite = useMemo(() => favorites.includes(job.id), [favorites, job.id]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShareClick?.(job);
  };

  const handleClick = () => {
    onClick?.(job);
  };

  return (
    <Card onClick={handleClick} className={classes.card}>
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Text size="lg" fw={500} className={classes.title}>
            {job.title}
          </Text>
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              color={isFavorite ? 'red' : 'gray'}
              onClick={handleFavoriteClick}
            >
              <IconHeart size={20} />
            </ActionIcon>
            <ActionIcon variant="subtle" onClick={handleShareClick}>
              <IconShare size={20} />
            </ActionIcon>
          </Group>
        </Group>

        <Text size="sm" c="dimmed">
          {job.company} • {job.location}
        </Text>

        <Group gap="xs">
          <Badge>{job.jobType}</Badge>
          <Badge>{job.experienceLevel}</Badge>
          {job.salary && (
            <Badge>
              {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()} {job.salary.currency}/{job.salary.period}
            </Badge>
          )}
        </Group>

        <Text lineClamp={3} size="sm">
          {job.description}
        </Text>
      </Stack>
    </Card>
  );
});