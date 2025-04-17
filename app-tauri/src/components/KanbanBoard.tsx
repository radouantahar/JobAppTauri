import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, Text, Button, Group, ActionIcon, Title, Loader } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import styles from '../styles/components/KanbanBoard.module.css';
import type { KanbanCard } from '../types/index';

interface Column {
  id: string;
  title: string;
  cards: KanbanCard[];
}

const CARDS_PER_PAGE = 10;

const initialColumns: Column[] = [
  { id: 'todo', title: 'À faire', cards: [] },
  { id: 'in-progress', title: 'En cours', cards: [] },
  { id: 'done', title: 'Terminé', cards: [] },
];

// Composant de carte mémorisé pour éviter les re-rendus inutiles
const KanbanCard = React.memo(({ card, onDelete }: { card: KanbanCard; onDelete: () => void }) => (
  <Card
    className={styles.card}
    p="md"
    radius="md"
    withBorder
  >
    <Group justify="space-between" mb="xs">
      <Text className={styles.cardTitle}>{card.title}</Text>
      <ActionIcon
        color="red"
        variant="subtle"
        onClick={onDelete}
        className={styles.deleteButton}
      >
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
    <Text size="sm" className={styles.cardDescription}>
      {card.description}
    </Text>
    <Text size="xs" className={styles.cardDate}>
      {new Date(card.updatedAt).toLocaleDateString('fr-FR')}
    </Text>
  </Card>
));

KanbanCard.displayName = 'KanbanCard';

export const KanbanBoard: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Mémorisation des colonnes pour éviter les re-rendus inutiles
  const memoizedColumns = useMemo(() => columns, [columns]);

  const loadCards = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      // TODO: Implémenter l'appel API avec pagination
      const response = await fetch(`/api/cards?page=${pageNum}&limit=${CARDS_PER_PAGE}`);
      const data = await response.json();
      
      if (data.cards.length < CARDS_PER_PAGE) {
        setHasMore(false);
      }

      setColumns(prevColumns => {
        const newColumns = [...prevColumns];
        data.cards.forEach((card: KanbanCard) => {
          const columnIndex = newColumns.findIndex(col => col.id === card.status);
          if (columnIndex !== -1) {
            newColumns[columnIndex].cards.push(card);
          }
        });
        return newColumns;
      });

      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des cartes:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const onDragEnd = useCallback((result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);
    const card = sourceColumn?.cards.find(c => c.id === draggableId);

    if (!sourceColumn || !destColumn || !card) return;

    const newSourceCards = [...sourceColumn.cards];
    newSourceCards.splice(source.index, 1);

    const newDestCards = [...destColumn.cards];
    newDestCards.splice(destination.index, 0, card);

    setColumns(columns.map(col => {
      if (col.id === source.droppableId) {
        return { ...col, cards: newSourceCards };
      }
      if (col.id === destination.droppableId) {
        return { ...col, cards: newDestCards };
      }
      return col;
    }));
  }, [columns]);

  const deleteCard = useCallback((columnId: string, cardId: string) => {
    setColumns(columns.map(col => {
      if (col.id === columnId) {
        return {
          ...col,
          cards: col.cards.filter(card => card.id !== cardId)
        };
      }
      return col;
    }));
  }, [columns]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadCards(page + 1);
    }
  }, [loading, hasMore, page, loadCards]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={styles.board}>
        {memoizedColumns.map(column => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                className={styles.column}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <div className={styles.columnHeader}>
                  <Title order={3} className={styles.columnTitle}>
                    {column.title}
                  </Title>
                </div>

                {column.cards.map((card, index) => (
                  <Draggable key={card.id} draggableId={card.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`${styles.card} ${snapshot.isDragging ? styles.cardDragging : ''}`}
                      >
                        <KanbanCard
                          card={card}
                          onDelete={() => deleteCard(column.id, card.id)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {loading && <Loader size="sm" className={styles.loader} />}
                
                {hasMore && !loading && (
                  <Button
                    variant="light"
                    fullWidth
                    onClick={loadMore}
                    className={styles.loadMoreButton}
                  >
                    Charger plus
                  </Button>
                )}

                <Button
                  leftSection={<IconPlus size={16} />}
                  variant="light"
                  fullWidth
                  className={styles.addButton}
                >
                  Ajouter une carte
                </Button>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard; 