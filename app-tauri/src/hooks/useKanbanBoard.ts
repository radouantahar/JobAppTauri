import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { KanbanCard } from '../types';

interface UseKanbanBoardReturn {
  cards: KanbanCard[];
  isLoading: boolean;
  error: Error | null;
  fetchCards: () => Promise<void>;
  updateCard: (cardId: string, updates: Partial<KanbanCard>) => Promise<void>;
}

export const useKanbanBoard = (): UseKanbanBoardReturn => {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await invoke<KanbanCard[]>('get_all_kanban_cards');
      setCards(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la récupération des cartes'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCard = useCallback(async (cardId: string, updates: Partial<KanbanCard>) => {
    try {
      setIsLoading(true);
      const result = await invoke<KanbanCard>('update_kanban_card', { cardId, updates });
      setCards(prevCards => 
        prevCards.map(card => card.id === cardId ? result : card)
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la mise à jour'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    cards,
    isLoading,
    error,
    fetchCards,
    updateCard,
  };
}; 