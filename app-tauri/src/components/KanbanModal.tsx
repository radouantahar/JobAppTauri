import React from 'react';
import { Modal, Button, Group, Text, Stack, Badge } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { useKanban } from '../hooks/useKanban';
import type { KanbanCard, Interview, InterviewType, ISODateString } from '../types';
import { createISODateString } from '../types';

/**
 * Props pour le composant KanbanModal
 */
interface KanbanModalProps {
  /** Identifiant de la carte Kanban */
  cardId: string;
  /** Fonction appelée lors de la fermeture du modal */
  onClose: () => void;
}

/**
 * Composant modal pour afficher les détails d'une carte Kanban
 * Affiche les informations détaillées d'une carte, y compris :
 * - Le statut de la candidature
 * - La date de création
 * - La description
 * - Les notes éventuelles
 * - Les entretiens programmés
 * 
 * @param props - Les propriétés du composant
 * @returns Le composant modal
 */
export const KanbanModal: React.FC<KanbanModalProps> = ({ cardId, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { card, isLoading, error } = useKanban(cardId);

  if (!isAuthenticated) return null;

  /**
   * Formate une date au format local
   * @param date - La date à formater
   * @returns La date formatée
   */
  const formatDate = (date: ISODateString) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Traduit le type d'entretien
   * @param type - Le type d'entretien
   * @returns Le type traduit
   */
  const translateInterviewType = (type: InterviewType): string => {
    const translations: Record<InterviewType, string> = {
      'phone': 'Téléphone',
      'video': 'Visio',
      'onsite': 'Sur site',
      'technical': 'Technique'
    };
    return translations[type];
  };

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
        <Text c="red">Erreur: {error.message}</Text>
      ) : !card ? (
        <Text>Carte non trouvée</Text>
      ) : (
        <Stack gap="md">
          <Group>
            <Badge>{card.status}</Badge>
            <Text c="dimmed">
              Créée le {formatDate(createISODateString(card.createdAt))}
            </Text>
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
                <Group key={index} gap="md">
                  <Text>{formatDate(interview.date)}</Text>
                  <Badge>{translateInterviewType(interview.type)}</Badge>
                  {interview.notes && (
                    <Text size="sm" c="dimmed">
                      {interview.notes}
                    </Text>
                  )}
                  {interview.outcome && (
                    <Badge 
                      color={
                        interview.outcome === 'positive' ? 'green' : 
                        interview.outcome === 'negative' ? 'red' : 
                        'yellow'
                      }
                    >
                      {interview.outcome === 'positive' ? 'Positif' :
                       interview.outcome === 'negative' ? 'Négatif' :
                       'En attente'}
                    </Badge>
                  )}
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