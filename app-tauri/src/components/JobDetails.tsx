import { memo, useMemo, useCallback, useState } from 'react';
import { 
  Card, 
  Stack, 
  Text, 
  Title, 
  Group, 
  Button, 
  Badge, 
  Divider, 
  Alert,
  Modal,
  Textarea,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import { 
  IconHeart, 
  IconHeartFilled, 
  IconShare, 
  IconMapPin,
  IconBuildingSkyscraper,
  IconCalendar,
  IconX,
  IconCheck
} from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../store';
import type { Job } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface JobDetailsProps {
  job: Job;
  onClose: () => void;
}

export const JobDetails = memo(function JobDetails({ job, onClose }: JobDetailsProps) {
  const { user } = useAuth();
  const { addFavorite, removeFavorite, favorites } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const isFavorite = useMemo(() => 
    favorites.some(fav => fav.id === job.id)
  , [favorites, job.id]);

  const formattedDate = useMemo(() => 
    formatDistanceToNow(new Date(job.publishedAt), { 
      addSuffix: true,
      locale: fr 
    })
  , [job.publishedAt]);

  const handleFavoriteToggle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isFavorite) {
        await removeFavorite(job.id);
      } else {
        await addFavorite(job);
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour des favoris:', err);
      setError('Une erreur est survenue lors de la mise à jour des favoris');
    } finally {
      setIsLoading(false);
    }
  }, [isFavorite, job, addFavorite, removeFavorite]);

  const handleShare = useCallback(async () => {
    if (!navigator.share) {
      setIsShareModalOpen(true);
      return;
    }

    try {
      await navigator.share({
        title: job.title,
        text: `${job.title} chez ${job.company}\n${job.description}`,
        url: job.url
      });
    } catch (err) {
      console.error('Erreur lors du partage:', err);
      setError('Une erreur est survenue lors du partage');
    }
  }, [job]);

  const handleShareSubmit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implémenter l'envoi du message via l'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsShareModalOpen(false);
      setShareMessage('');
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      setError('Une erreur est survenue lors de l\'envoi du message');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const jobTypeBadge = useMemo(() => {
    const types = {
      'full-time': 'Temps plein',
      'part-time': 'Temps partiel',
      'contract': 'Contrat',
      'internship': 'Stage',
      'temporary': 'Temporaire'
    };
    return types[job.jobType] || job.jobType;
  }, [job.jobType]);

  const experienceBadge = useMemo(() => {
    const levels = {
      'entry': 'Débutant',
      'mid': 'Intermédiaire',
      'senior': 'Senior',
      'lead': 'Lead',
      'executive': 'Directeur'
    };
    return levels[job.experienceLevel] || job.experienceLevel;
  }, [job.experienceLevel]);

  return (
    <Card withBorder shadow="sm" radius="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>{job.title}</Title>
          <Group>
            <Tooltip label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}>
              <ActionIcon
                variant="light"
                color={isFavorite ? "red" : "gray"}
                onClick={handleFavoriteToggle}
                loading={isLoading}
                disabled={!user}
              >
                {isFavorite ? <IconHeartFilled size={18} /> : <IconHeart size={18} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Partager">
              <ActionIcon
                variant="light"
                color="blue"
                onClick={handleShare}
              >
                <IconShare size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Fermer">
              <ActionIcon
                variant="light"
                color="gray"
                onClick={onClose}
              >
                <IconX size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {error && (
          <Alert icon={<IconX size={16} />} title="Erreur" color="red">
            {error}
          </Alert>
        )}

        <Group justify="space-between">
          <Badge leftSection={<IconBuildingSkyscraper size={12} />}>
            {job.company}
          </Badge>
          <Badge leftSection={<IconMapPin size={12} />}>
            {job.location}
          </Badge>
          <Badge leftSection={<IconCalendar size={12} />}>
            {formattedDate}
          </Badge>
          {job.salary && (
            <Text>
              {`${job.salary.min}-${job.salary.max} ${job.salary.currency}/${job.salary.period}`}
            </Text>
          )}
        </Group>

        <Group>
          <Badge color="blue">{jobTypeBadge}</Badge>
          <Badge color="green">{experienceBadge}</Badge>
        </Group>

        <Divider />

        <Text size="sm" color="dimmed">
          {job.description}
        </Text>

        <Group justify="right">
          <Button 
            component="a" 
            href={job.url} 
            target="_blank" 
            rel="noopener noreferrer"
            variant="light"
          >
            Voir l'offre
          </Button>
        </Group>
      </Stack>

      <Modal
        opened={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Partager l'offre"
      >
        <Stack>
          <Textarea
            label="Message (optionnel)"
            placeholder="Ajoutez un message personnel..."
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            minRows={3}
          />
          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={() => setIsShareModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleShareSubmit}
              loading={isLoading}
              leftSection={<IconCheck size={16} />}
            >
              Partager
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
}); 