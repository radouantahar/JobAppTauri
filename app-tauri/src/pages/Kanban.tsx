import { useState, useEffect } from 'react';
import { Container, Title, Button, Modal, TextInput } from '@mantine/core';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { kanbanService } from '../services/kanban';
import { useAuth } from '../contexts/AuthContext';
import { KanbanCardForm } from '../components/KanbanCardForm';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { KanbanCardComponent } from '../components/kanban/KanbanCard';
import type { KanbanCard } from '../types/kanban';
import { useNavigate } from 'react-router-dom';
import { createISODateString } from '../types/core';
import type { Job, JobType, ExperienceLevel, JobSource, Salary } from '../types/job';
import { useKanbanStore } from '../store/kanban';

const Kanban = () => {
  const { user } = useAuth();
  const [isFormOpened, setIsFormOpened] = useState(false);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | undefined>();
  const navigate = useNavigate();
  const { columns, moveCard, addColumn, removeColumn } = useKanbanStore();
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  useEffect(() => {
    if (user) {
      loadCards();
    }
  }, [user]);

  const loadCards = async () => {
    try {
      const userCards = await kanbanService.getCards(user!.id);
      const mappedCards: KanbanCard[] = userCards.map((card: Partial<Job> & { id: string; status: string }) => ({
        id: card.id,
        jobId: card.id,
        title: card.title || '',
        company: card.company || '',
        location: card.location || '',
        type: card.type || 'CDI' as JobType,
        url: card.url || '',
        description: card.description || '',
        experienceLevel: card.experienceLevel || 'mid' as ExperienceLevel,
        jobType: card.jobType || 'CDI' as JobType,
        postedAt: card.postedAt || new Date().toISOString(),
        status: card.status as 'todo' | 'in-progress' | 'done',
        createdAt: createISODateString(new Date().toISOString()),
        updatedAt: createISODateString(new Date().toISOString()),
        notes: '',
        interviews: [],
        salary: card.salary || {
          min: 0,
          max: 0,
          currency: 'EUR',
          period: 'year'
        } as Salary,
        skills: card.skills || [],
        remote: card.remote || false,
        source: card.source || 'linkedin' as JobSource,
        commuteTimes: card.commuteTimes || []
      }));
      // Mettre à jour les cartes dans les colonnes appropriées
      mappedCards.forEach(card => {
        const column = columns.find(col => col.id === card.status);
        if (column) {
          column.cards.push(card);
        }
      });
    } catch (error) {
      console.error('Erreur lors du chargement des cartes:', error);
    }
  };

  const handleCardClick = (card: KanbanCard) => {
    setSelectedCard(card);
    setIsFormOpened(true);
    navigate(`/job/${card.id}`);
  };

  const handleFormSuccess = () => {
    loadCards();
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    moveCard(
      result.source.droppableId,
      result.destination.droppableId,
      result.draggableId
    );
  };

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      addColumn(newColumnTitle.trim());
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  return (
    <Container size="xl" py="xl">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title order={2}>Tableau Kanban</Title>
          <Button onClick={() => setIsAddingColumn(true)}>
            Ajouter une colonne
          </Button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {columns.map((column) => (
              <div key={column.id} style={{ flex: 1 }}>
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <KanbanColumn
                      title={column.title}
                      provided={provided}
                      onRemove={() => removeColumn(column.id)}
                    >
                      {column.cards.map((card, index) => (
                        <KanbanCardComponent
                          key={card.id}
                          card={card}
                          index={index}
                          onClick={() => handleCardClick(card)}
                        />
                      ))}
                    </KanbanColumn>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>

        <KanbanCardForm
          opened={isFormOpened}
          onClose={() => setIsFormOpened(false)}
          card={selectedCard}
          onSubmit={handleFormSuccess}
          jobId={selectedCard?.id || ''}
        />

        <Modal
          opened={isAddingColumn}
          onClose={() => setIsAddingColumn(false)}
          title="Ajouter une colonne"
        >
          <TextInput
            label="Titre de la colonne"
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            placeholder="Entrez le titre de la colonne"
          />
          <Button onClick={handleAddColumn} mt="md">
            Ajouter
          </Button>
        </Modal>
      </div>
    </Container>
  );
};

export default Kanban;