import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface Card {
  id: string;
  title: string;
  description: string;
  status: string;
  jobId: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  interviews?: Array<{
    date: string;
    type: string;
    notes: string;
  }>;
}

interface UseKanbanReturn {
  card: Card | null;
  isLoading: boolean;
  error: Error | null;
  updateCard: (cardData: Partial<Card>) => Promise<void>;
  deleteCard: () => Promise<void>;
  moveCard: (newStatus: string) => Promise<void>;
}

export const useKanban = (cardId: string): UseKanbanReturn => {
  const [card, setCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setIsLoading(true);
        const result = await invoke<Card>('get_card', { cardId });
        setCard(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCard();
  }, [cardId]);

  const updateCard = async (cardData: Partial<Card>) => {
    try {
      setIsLoading(true);
      const result = await invoke<Card>('update_card', { 
        cardId,
        cardData 
      });
      setCard(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la mise à jour'));
    } finally {
      setIsLoading(false);
    }
  };

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

  const moveCard = async (newStatus: string) => {
    try {
      setIsLoading(true);
      const result = await invoke<Card>('move_card', { 
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