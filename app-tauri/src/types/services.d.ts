import { KanbanCard } from './index';

export interface KanbanService {
  getCards(userId: string): Promise<KanbanCard[]>;
  createCard(card: Omit<KanbanCard, 'id'>): Promise<KanbanCard>;
  updateCard(card: KanbanCard): Promise<KanbanCard>;
  updateCardStatus(cardId: string, newStatus: string): Promise<void>;
  deleteCard(cardId: string): Promise<void>;
}

declare module '../services/kanban' {
  export const kanbanService: KanbanService;
} 