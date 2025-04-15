import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useKanban } from '../hooks/useKanban';

interface KanbanModalProps {
  cardId: string;
  onClose: () => void;
}

export const KanbanModal: React.FC<KanbanModalProps> = ({ cardId, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { card, isLoading, error, updateCard, deleteCard, moveCard } = useKanban(cardId);

  if (!isAuthenticated) return null;
  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;
  if (!card) return null;

  return (
    <div className="kanban-modal">
      <h2>{card.title}</h2>
      <p>{card.description}</p>
      <button onClick={onClose}>Fermer</button>
    </div>
  );
}; 