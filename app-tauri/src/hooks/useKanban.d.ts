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

declare function useKanban(cardId: string): UseKanbanReturn;

export { useKanban, Card, UseKanbanReturn }; 