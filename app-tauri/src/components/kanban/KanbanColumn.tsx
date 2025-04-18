import { Paper, Title, Box, ActionIcon } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import type { DroppableProvided } from '@hello-pangea/dnd';

interface KanbanColumnProps {
  title: string;
  provided: DroppableProvided;
  onRemove: () => void;
  children: React.ReactNode;
}

export function KanbanColumn({ title, provided, onRemove, children }: KanbanColumnProps) {
  return (
    <Paper
      shadow="xs"
      p="md"
      withBorder
      style={{ minHeight: 500, width: '100%' }}
      ref={provided.innerRef}
      {...provided.droppableProps}
    >
      <Box mb="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title order={3}>{title}</Title>
        <ActionIcon onClick={onRemove} color="red" variant="subtle">
          <IconTrash size={16} />
        </ActionIcon>
      </Box>
      {children}
      {provided.placeholder}
    </Paper>
  );
} 