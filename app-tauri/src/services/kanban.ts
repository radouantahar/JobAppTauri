import { invoke } from '@tauri-apps/api/tauri';
import { KanbanCard } from '../types';

export const kanbanService = {
  async getCards(userId: string): Promise<KanbanCard[]> {
    try {
      return await invoke('get_kanban_cards', { userId });
    } catch (error) {
      console.error('Erreur lors de la récupération des cartes:', error);
      throw error;
    }
  },

  async createCard(card: Omit<KanbanCard, 'id'>): Promise<KanbanCard> {
    try {
      return await invoke('create_kanban_card', { card });
    } catch (error) {
      console.error('Erreur lors de la création de la carte:', error);
      throw error;
    }
  },

  async updateCard(card: KanbanCard): Promise<KanbanCard> {
    try {
      return await invoke('update_kanban_card', { card });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la carte:', error);
      throw error;
    }
  },

  async updateCardStatus(cardId: string, newStatus: string): Promise<void> {
    try {
      await invoke('update_kanban_card_status', { cardId, newStatus });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  },

  async deleteCard(cardId: string): Promise<void> {
    try {
      await invoke('delete_kanban_card', { cardId });
    } catch (error) {
      console.error('Erreur lors de la suppression de la carte:', error);
      throw error;
    }
  },
}; 