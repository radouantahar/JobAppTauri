import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { KanbanCard } from '../types';

interface UseKanbanReturn {
  card: KanbanCard | null;
  isLoading: boolean;
  error: Error | null;
  updateCard: (cardData: Partial<KanbanCard>) => Promise<void>;
  deleteCard: () => Promise<void>;
  moveCard: (newStatus: string) => Promise<void>;
}

/**
 * Hook pour gérer une carte Kanban
 * @param cardId - Identifiant de la carte
 * @returns Les données et fonctions pour gérer la carte
 */
export const useKanban = (cardId: string): UseKanbanReturn => {
  const [card, setCard] = useState<KanbanCard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Met à jour une carte Kanban
   * @param updates - Les données à mettre à jour
   */
  const updateCard = useCallback(async (updates: Partial<KanbanCard>) => {
    try {
      setIsLoading(true);
      const result = await invoke('update_kanban_card', { cardId, updates });
      setCard(result as KanbanCard);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la mise à jour'));
    } finally {
      setIsLoading(false);
    }
  }, [cardId]);

  /**
   * Supprime une carte Kanban
   */
  const deleteCard = async () => {
    try {
      setIsLoading(true);
      await invoke('delete_card', { cardId });
      setCard(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la suppression'));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Déplace une carte vers un nouveau statut
   * @param newStatus - Le nouveau statut de la carte
   */
  const moveCard = async (newStatus: string) => {
    try {
      setIsLoading(true);
      const result = await invoke<KanbanCard>('move_card', { 
        cardId,
        newStatus 
      });
      setCard(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors du déplacement'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    card,
    isLoading,
    error,
    updateCard,
    deleteCard,
    moveCard,
  };
}; 