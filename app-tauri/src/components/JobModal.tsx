import React from 'react';
import { Modal, Button, Group, Text, Stack, Badge, Loader, Alert, Notification } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { useJob } from '../hooks/useJob';
import { IconCheck, IconX } from '@tabler/icons-react';

interface JobModalProps {
  jobId: string;
  onClose: () => void;
}

export const JobModal: React.FC<JobModalProps> = ({ jobId, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { job, isLoading, error, applyToJob, saveJob } = useJob(jobId);
  const [actionState, setActionState] = React.useState<{
    type: 'apply' | 'save' | null;
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ type: null, status: 'idle', message: '' });

  const handleApply = async () => {
    if (!job) return;
    
    setActionState({ type: 'apply', status: 'loading', message: 'Envoi de la candidature...' });
    try {
      await applyToJob();
      setActionState({ 
        type: 'apply', 
        status: 'success', 
        message: 'Candidature envoyée avec succès !' 
      });
    } catch (err) {
      setActionState({ 
        type: 'apply', 
        status: 'error', 
        message: 'Erreur lors de l\'envoi de la candidature' 
      });
    }
  };

  const handleSave = async () => {
    if (!job) return;
    
    setActionState({ type: 'save', status: 'loading', message: 'Sauvegarde en cours...' });
    try {
      await saveJob();
      setActionState({ 
        type: 'save', 
        status: 'success', 
        message: 'Offre sauvegardée avec succès !' 
      });
    } catch (err) {
      setActionState({ 
        type: 'save', 
        status: 'error', 
        message: 'Erreur lors de la sauvegarde' 
      });
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={job?.title || 'Offre d\'emploi'}
      size="lg"
      aria-labelledby="job-modal-title"
    >
      {isLoading ? (
        <Stack align="center" py="xl">
          <Loader size="lg" />
          <Text>Chargement de l'offre...</Text>
        </Stack>
      ) : error ? (
        <Alert color="red" title="Erreur" icon={<IconX />}>
          {error.message}
        </Alert>
      ) : !job ? (
        <Alert color="yellow" title="Information">
          Offre non trouvée
        </Alert>
      ) : (
        <Stack gap="md">
          {actionState.status !== 'idle' && (
            <Notification
              color={actionState.status === 'success' ? 'green' : actionState.status === 'error' ? 'red' : 'blue'}
              icon={actionState.status === 'success' ? <IconCheck /> : <Loader size="sm" />}
              title={actionState.status === 'success' ? 'Succès' : actionState.status === 'error' ? 'Erreur' : 'En cours'}
            >
              {actionState.message}
            </Notification>
          )}

          <Group>
            <Text fw={500} fz="lg" id="job-modal-title">{job.company}</Text>
            <Badge>{job.location}</Badge>
            {job.remote && <Badge color="green">Remote</Badge>}
          </Group>
          
          <Text>{job.description}</Text>
          
          {job.salary && (
            <Text>
              Salaire: {job.salary.min} - {job.salary.max} {job.salary.currency}/{job.salary.period}
            </Text>
          )}
          
          <Group mt="xl" justify="flex-end">
            <Button 
              onClick={handleApply}
              loading={actionState.type === 'apply' && actionState.status === 'loading'}
              disabled={actionState.status === 'loading'}
            >
              Postuler
            </Button>
            <Button 
              variant="light" 
              onClick={handleSave}
              loading={actionState.type === 'save' && actionState.status === 'loading'}
              disabled={actionState.status === 'loading'}
            >
              Sauvegarder
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={actionState.status === 'loading'}
            >
              Fermer
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}; 