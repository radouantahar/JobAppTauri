import { Paper, Text, Group, Badge } from '@mantine/core';
import { Draggable } from '@hello-pangea/dnd';
import type { KanbanCard } from '../../types/kanban';

interface KanbanCardProps {
  card: KanbanCard;
  index: number;
  onClick: () => void;
}

export function KanbanCardComponent({ card, index, onClick }: KanbanCardProps) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided) => (
        <Paper
          shadow="xs"
          p="md"
          withBorder
          mb="sm"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          style={{ cursor: 'pointer', ...provided.draggableProps.style }}
        >
          <Text size="lg" weight={500} mb="xs">
            {card.title}
          </Text>
          <Group position="apart" mb="xs">
            <Text size="sm" color="dimmed">
              {card.company}
            </Text>
            <Badge>{card.type}</Badge>
          </Group>
          <Text size="sm" color="dimmed">
            {card.location}
          </Text>
          {card.remote && (
            <Badge color="blue" mt="xs">
              Remote
            </Badge>
          )}
        </Paper>
      )}
    </Draggable>
  );
} 