import React, { useEffect } from 'react';
import { useKanbanBoard } from '../hooks/useKanbanBoard';
import { KanbanCard } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const KanbanColumn: React.FC<{
  title: string;
  cards: KanbanCard[];
}> = ({ title, cards }) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Non spécifié';
    try {
      return format(new Date(dateString), 'PPP', { locale: fr });
    } catch (error) {
      return 'Date invalide';
    }
  };

  return (
    <div className="flex-1 p-4 bg-gray-100 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="space-y-4">
        {cards.map(card => (
          <div key={card.id} className="kanban-card">
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <p>Dernière mise à jour : {formatDate(card.updatedAt)}</p>
            {card.notes && <p>Notes : {card.notes}</p>}
            {card.interviews && card.interviews.length > 0 && (
              <div className="interviews">
                <h4>Entretiens :</h4>
                {card.interviews.map((interview, index) => (
                  <p key={index}>
                    {interview.type} - {formatDate(interview.date)}
                    {interview.notes && <span> - {interview.notes}</span>}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Kanban: React.FC = () => {
  const { cards, isLoading, error, fetchCards } = useKanbanBoard();

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div>Erreur: {error.message}</div>;
  }

  const columns = {
    'À postuler': cards.filter(card => card.status === 'À postuler'),
    'En cours': cards.filter(card => card.status === 'En cours'),
    'Entretiens': cards.filter(card => card.status === 'Entretiens'),
    'Offres': cards.filter(card => card.status === 'Offres'),
    'Refusés': cards.filter(card => card.status === 'Refusés'),
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tableau Kanban</h1>
      <div className="flex gap-4">
        {Object.entries(columns).map(([title, columnCards]) => (
          <KanbanColumn
            key={title}
            title={title}
            cards={columnCards}
          />
        ))}
      </div>
    </div>
  );
};

export default Kanban;