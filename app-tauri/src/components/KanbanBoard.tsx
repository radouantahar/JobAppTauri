import React, { useEffect, useState } from 'react';
import { Container, Paper, Title, Text, Group, Stack, Badge, ActionIcon, Loader } from '@mantine/core';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { IconGripVertical, IconPlus } from '@tabler/icons-react';
import { useKanbanBoard } from '../hooks/useKanbanBoard';
import { KanbanCard, KanbanColumn } from '../types';
import { kanbanService } from '../services/api';
import { KanbanModal } from './KanbanModal';

interface KanbanBoardProps {
  columns: KanbanColumn[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ columns }) => {
  const { cards, isLoading, error, fetchCards, updateCard } = useKanbanBoard();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const cardId = result.draggableId;
    const toColumnId = parseInt(destination.droppableId);
    const position = destination.index;

    try {
      await kanbanService.moveCard(parseInt(cardId), toColumnId, position);
      await fetchCards();
    } catch (err) {
      console.error('Erreur lors du déplacement de la carte:', err);
    }
  };

  const handleCardClick = (cardId: string) => {
    setSelectedCard(cardId);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Group justify="center">
          <Loader size="xl" />
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Text color="red">Erreur: {error.message}</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Group align="flex-start" gap="xl">
          {columns.map((column) => (
            <Droppable key={column.id} droppableId={column.id.toString()}>
              {(provided: DroppableProvided) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  p="md"
                  style={{ width: 300, minHeight: 500 }}
                  withBorder
                >
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Title order={4}>{column.name}</Title>
                      <Badge>{column.cards.length}</Badge>
                    </Group>

                    {column.cards.map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id.toString()} index={index}>
                        {(provided: DraggableProvided) => (
                          <Paper
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            p="sm"
                            withBorder
                            style={{
                              ...provided.draggableProps.style,
                              cursor: 'pointer',
                            }}
                            onClick={() => handleCardClick(card.id.toString())}
                          >
                            <Group justify="space-between" wrap="nowrap">
                              <div {...provided.dragHandleProps}>
                                <IconGripVertical size={16} />
                              </div>
                              <Stack gap={0} style={{ flex: 1 }}>
                                <Text size="sm" fw={500} truncate>
                                  {card.title}
                                </Text>
                                <Text size="xs" c="dimmed" truncate>
                                  {card.description}
                                </Text>
                              </Stack>
                            </Group>
                          </Paper>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Stack>
                </Paper>
              )}
            </Droppable>
          ))}
        </Group>
      </DragDropContext>

      {selectedCard && (
        <KanbanModal
          cardId={selectedCard}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCard(null);
          }}
        />
      )}
    </Container>
  );
}; 