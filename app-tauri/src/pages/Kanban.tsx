import { useState, useEffect } from 'react';
import { Container, Title, SimpleGrid, Button, Group } from '@mantine/core';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { kanbanService } from '../services/kanban';
import { useAuth } from '../contexts/AuthContext';
import { KanbanCardForm } from '../components/KanbanCardForm';
import KanbanColumn from '../components/KanbanColumn';
import { KanbanCard } from '../types/kanban';
import { useNavigate } from 'react-router-dom';
import { createISODateString } from '../types/core';
import type { Job } from '../types/job';

const COLUMNS = [
  { id: 'todo', title: 'Candidatures envoyées' },
  { id: 'in-progress', title: 'Entretiens' },
  { id: 'done', title: 'Offres' },
  { id: 'rejected', title: 'Refusés' },
];

export function Kanban() {
  const { user } = useAuth();
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [isFormOpened, setIsFormOpened] = useState(false);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | undefined>();
  const navigate = useNavigate();

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
        type: card.type || 'CDI',
        url: card.url || '',
        description: card.description || '',
        experienceLevel: card.experienceLevel || 'mid',
        jobType: card.jobType || 'full-time',
        publishedAt: card.publishedAt || new Date().toISOString(),
        status: card.status as 'todo' | 'in-progress' | 'done',
        createdAt: createISODateString(new Date().toISOString()),
        updatedAt: createISODateString(new Date().toISOString()),
        notes: '',
        interviews: [],
        salary: card.salary,
        skills: card.skills || [],
        remote: card.remote || false,
        source: card.source || 'linkedin',
        matchingScore: card.matchingScore || 0,
        commuteTimes: card.commuteTimes || [],
        contractType: card.contractType || 'CDI'
      }));
      setCards(mappedCards);
    } catch (error) {
      console.error('Erreur lors du chargement des cartes:', error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const card = cards.find((c) => c.id === draggableId);

    if (card && card.status !== destination.droppableId) {
      try {
        await kanbanService.updateCardStatus(draggableId, destination.droppableId);
        setCards((prev) =>
          prev.map((c) =>
            c.id === draggableId ? { ...c, status: destination.droppableId as 'todo' | 'in-progress' | 'done' } : c
          )
        );
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
      }
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

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Tableau Kanban</Title>
        <Button onClick={() => setIsFormOpened(true)}>
          Nouvelle candidature
        </Button>
      </Group>

      <DragDropContext onDragEnd={handleDragEnd}>
        <SimpleGrid cols={4} spacing="md">
          {COLUMNS.map((column) => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <KanbanColumn
                    title={column.title}
                    cards={cards.filter((card) => card.status === column.id)}
                    onCardClick={handleCardClick}
                  />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </SimpleGrid>
      </DragDropContext>

      <KanbanCardForm
        opened={isFormOpened}
        onClose={() => setIsFormOpened(false)}
        card={selectedCard}
        onSubmit={handleFormSuccess}
        jobId={selectedCard?.id || ''}
      />
    </Container>
  );
}

export default Kanban;