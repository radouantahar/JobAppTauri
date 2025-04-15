import { memo, useCallback, useMemo } from 'react';
import { Card, Text, Group, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { IconHeart, IconHeartFilled, IconShare, IconMapPin } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../store';
import type { Job } from '../types';
import styles from './JobCard.module.css';

interface JobCardProps {
  job: Job;
  onClick: () => void;
  onFavoriteClick?: (job: Job) => void;
  onShareClick?: (job: Job) => void;
}

// Sous-composant pour l'en-tête de la carte
const JobCardHeader = memo(function JobCardHeader({ 
  title, 
  company, 
  isFavorite, 
  onFavoriteClick, 
  onShareClick 
}: { 
  title: string; 
  company: string; 
  isFavorite: boolean; 
  onFavoriteClick: (e: React.MouseEvent) => void; 
  onShareClick: (e: React.MouseEvent) => void; 
}) {
  return (
    <Group justify="space-between" mb="xs">
      <div>
        <Text fw={500} size="lg" mb={5}>{title}</Text>
        <Text c="dimmed" size="sm">{company}</Text>
      </div>
      <Group gap={5}>
        <Tooltip label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
          <ActionIcon onClick={onFavoriteClick} color="red" variant={isFavorite ? 'filled' : 'light'}>
            {isFavorite ? <IconHeartFilled size={18} /> : <IconHeart size={18} />}
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Partager">
          <ActionIcon onClick={onShareClick} variant="light">
            <IconShare size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
});

// Sous-composant pour les informations de localisation et salaire
const JobCardInfo = memo(function JobCardInfo({ 
  location, 
  salary 
}: { 
  location: string; 
  salary?: { min?: number; max?: number; currency?: string }; 
}) {
  const formattedSalary = useMemo(() => {
    if (!salary) return 'Salaire non spécifié';
    
    const min = salary.min;
    const max = salary.max;
    const currency = salary.currency || '€';
    
    if (typeof min !== 'number' && typeof max !== 'number') {
      return 'Salaire non spécifié';
    }
    
    if (typeof min === 'number' && typeof max === 'number') {
      return `${min} - ${max} ${currency}`;
    }
    
    if (typeof min === 'number') {
      return `À partir de ${min} ${currency}`;
    }
    
    if (typeof max === 'number') {
      return `Jusqu'à ${max} ${currency}`;
    }
    
    return 'Salaire non spécifié';
  }, [salary]);

  return (
    <Group justify="space-between" mt="md">
      <Group gap="xs">
        <IconMapPin size={16} />
        <Text size="sm">{location}</Text>
      </Group>
      {salary && (
        <Text size="sm" fw={500}>
          {formattedSalary}
        </Text>
      )}
    </Group>
  );
});

export const JobCard = memo(function JobCard({ job, onClick, onFavoriteClick, onShareClick }: JobCardProps) {
  const { isAuthenticated } = useAuth();
  const { addFavorite, removeFavorite, favorites } = useAppStore();
  const isFavorite = useMemo(() => favorites.some(fav => fav.id === job.id), [favorites, job.id]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      // TODO: Show login modal
      return;
    }

    if (isFavorite) {
      removeFavorite(job.id);
    } else {
      addFavorite(job);
    }
    onFavoriteClick?.(job);
  }, [isAuthenticated, isFavorite, job, addFavorite, removeFavorite, onFavoriteClick]);

  const handleShareClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onShareClick?.(job);
  }, [job, onShareClick]);

  return (
    <Card onClick={onClick} className={styles.card}>
      <JobCardHeader
        title={job.title}
        company={job.company}
        isFavorite={isFavorite}
        onFavoriteClick={handleFavoriteClick}
        onShareClick={handleShareClick}
      />

      <JobCardInfo
        location={job.location}
        salary={job.salary}
      />

      {job.experienceLevel && (
        <Badge color="blue" mt="sm">
          {job.experienceLevel}
        </Badge>
      )}
    </Card>
  );
});