import React from 'react';
import { Modal, Button, Group, Text, Stack, Badge } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { useJob } from '../hooks/useJob';

interface JobModalProps {
  jobId: string;
  onClose: () => void;
}

export const JobModal: React.FC<JobModalProps> = ({ jobId, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { job, isLoading, error, applyToJob, saveJob } = useJob(jobId);

  const handleApply = async () => {
    if (job) {
      await applyToJob();
    }
  };

  const handleSave = async () => {
    if (job) {
      await saveJob();
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={job?.title || 'Offre d\'emploi'}
      size="lg"
    >
      {isLoading ? (
        <Text>Chargement...</Text>
      ) : error ? (
        <Text color="red">Erreur: {error.message}</Text>
      ) : !job ? (
        <Text>Offre non trouvée</Text>
      ) : (
        <Stack gap="md">
          <Group>
            <Text fw={500} fz="lg">{job.company}</Text>
            <Badge>{job.location}</Badge>
          </Group>
          
          <Text>{job.description}</Text>
          
          {job.salary && (
            <Text>
              Salaire: {job.salary.min} - {job.salary.max} {job.salary.currency}/{job.salary.period}
            </Text>
          )}
          
          <Group mt="xl" justify="flex-end">
            <Button onClick={handleApply}>Postuler</Button>
            <Button variant="light" onClick={handleSave}>Sauvegarder</Button>
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}; 