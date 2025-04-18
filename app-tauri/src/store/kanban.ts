import { create } from 'zustand';
import type { KanbanCard } from '../types/kanban';

interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

interface KanbanStore {
  columns: KanbanColumn[];
  moveCard: (sourceId: string, destinationId: string, cardId: string) => void;
  addColumn: (title: string) => void;
  removeColumn: (columnId: string) => void;
}

export const useKanbanStore = create<KanbanStore>((set) => ({
  columns: [
    { id: 'todo', title: 'Candidatures envoyées', cards: [] },
    { id: 'in-progress', title: 'Entretiens', cards: [] },
    { id: 'done', title: 'Offres', cards: [] },
    { id: 'rejected', title: 'Refusés', cards: [] },
  ],

  moveCard: (sourceId, destinationId, cardId) => {
    set((state) => {
      const sourceColumn = state.columns.find((col) => col.id === sourceId);
      const destColumn = state.columns.find((col) => col.id === destinationId);
      
      if (!sourceColumn || !destColumn) return state;

      const card = sourceColumn.cards.find((c) => c.id === cardId);
      if (!card) return state;

      const newColumns = state.columns.map((col) => {
        if (col.id === sourceId) {
          return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
        }
        if (col.id === destinationId) {
          return { ...col, cards: [...col.cards, { ...card, status: destinationId }] };
        }
        return col;
      });

      return { ...state, columns: newColumns };
    });
  },

  addColumn: (title) => {
    set((state) => ({
      columns: [...state.columns, { id: Date.now().toString(), title, cards: [] }],
    }));
  },

  removeColumn: (columnId) => {
    set((state) => ({
      columns: state.columns.filter((col) => col.id !== columnId),
    }));
  },
})); 