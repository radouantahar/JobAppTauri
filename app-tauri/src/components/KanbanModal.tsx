import React from 'react';
import { Modal, Button, Group, Text, Stack, Badge } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { useKanban } from '../hooks/useKanban';

interface KanbanModalProps {
  cardId: string;
  onClose: () => void;
}

export const KanbanModal: React.FC<KanbanModalProps> = ({ cardId, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { card, isLoading, error } = useKanban(cardId);

  if (!isAuthenticated) return null;

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={card?.title || 'Carte Kanban'}
      size="lg"
    >
      {isLoading ? (
        <Text>Chargement...</Text>
      ) : error ? (
        <Text color="red">Erreur: {error.message}</Text>
      ) : !card ? (
        <Text>Carte non trouvée</Text>
      ) : (
        <Stack gap="md">
          <Group>
            <Badge>{card.status}</Badge>
            <Text c="dimmed">Créée le {new Date(card.createdAt).toLocaleDateString()}</Text>
          </Group>
          
          <Text>{card.description}</Text>
          
          {card.notes && (
            <Stack gap="xs">
              <Text fw={500}>Notes :</Text>
              <Text>{card.notes}</Text>
            </Stack>
          )}
          
          {card.interviews && card.interviews.length > 0 && (
            <Stack gap="xs">
              <Text fw={500}>Entretiens :</Text>
              {card.interviews.map((interview, index) => (
                <Group key={index}>
                  <Text>{new Date(interview.date).toLocaleDateString()}</Text>
                  <Badge>{interview.type}</Badge>
                  {interview.notes && <Text size="sm">{interview.notes}</Text>}
                </Group>
              ))}
            </Stack>
          )}
          
          <Group mt="xl" justify="flex-end">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}; 