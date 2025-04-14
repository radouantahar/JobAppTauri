import { useState, useEffect } from 'react';
import { Container, Grid, Text, Badge, Card, Group, Button } from '@mantine/core';
import { IconPlus, IconArrowRight } from '@tabler/icons-react';
import { kanbanService } from '../services/api';
import { useAppStore } from '../store';
import type { KanbanColumn as KanbanColumnType } from '../types';

export function KanbanPage() {
  const [columns, setColumns] = useState<KanbanColumnType[]>([]);
  const { setLoading } = useAppStore();

  useEffect(() => {
    loadKanbanData();
  }, []);

  const loadKanbanData = async () => {
    setLoading(true);
    try {
      const kanbanColumns = await kanbanService.getKanbanColumns();
      setColumns(kanbanColumns);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveJob = async (jobId: number, toColumnId: number) => {
    setLoading(true);
    try {
      await kanbanService.moveCard(jobId, toColumnId, 0);
      loadKanbanData(); // Refresh data
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Text size="xl" fw={700}>Application Tracker</Text>
        <Button leftSection={<IconPlus size={16} />} variant="light">
          Add Job
        </Button>
      </Group>

      <Grid gutter="xl">
        {columns.map((column) => (
          <Grid.Col key={column.id} span={3}>
            <Card withBorder radius="md" h="100%">
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <Badge color={column.color} variant="filled" />
                  <Text fw={600}>{column.name}</Text>
                </Group>
                <Badge variant="light">{column.cards.length}</Badge>
              </Group>

              {column.cards.length > 0 ? (
                column.cards.map((card) => (
                  <Card key={card.id} withBorder mb="sm" p="sm">
                    <Text fw={500} lineClamp={1}>{card.job.title}</Text>
                    <Text size="sm" c="dimmed" lineClamp={1}>{card.job.company}</Text>
                    <Group justify="space-between" mt="sm">
                      <Text size="xs">
                        {card.appliedAt ? new Date(card.appliedAt).toLocaleDateString() : 'Not applied'}
                      </Text>
                      {columns[columns.findIndex(c => c.id === column.id) + 1] && (
                        <Button
                          size="xs"
                          variant="subtle"
                          rightSection={<IconArrowRight size={14} />}
                          onClick={() => handleMoveJob(card.id, columns[columns.findIndex(c => c.id === column.id) + 1].id)}
                        >
                          Next
                        </Button>
                      )}
                    </Group>
                  </Card>
                ))
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  No jobs in this column
                </Text>
              )}
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
}