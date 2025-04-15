import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Container, Grid, Text, Badge, Card, Group, Button } from '@mantine/core';
import { IconPlus, IconArrowRight } from '@tabler/icons-react';
import { kanbanService } from '../services/api';
import { useAppStore } from '../store';
import type { KanbanColumn as KanbanColumnType } from '../types';

const KanbanColumn = memo(function KanbanColumn({ 
  column, 
  onMoveJob, 
  nextColumnId 
}: { 
  column: KanbanColumnType;
  onMoveJob: (jobId: number, toColumnId: number) => void;
  nextColumnId?: number;
}) {
  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  }, []);

  return (
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
                {card.appliedAt ? formatDate(card.appliedAt) : 'Non postulé'}
              </Text>
              {nextColumnId && (
                <Button
                  size="xs"
                  variant="subtle"
                  rightSection={<IconArrowRight size={14} />}
                  onClick={() => onMoveJob(card.id, nextColumnId)}
                >
                  Suivant
                </Button>
              )}
            </Group>
          </Card>
        ))
      ) : (
        <Text size="sm" c="dimmed" ta="center" py="md">
          Aucune offre dans cette colonne
        </Text>
      )}
    </Card>
  );
});

export function KanbanPage() {
  const [columns, setColumns] = useState<KanbanColumnType[]>([]);
  const { setLoading } = useAppStore();

  const loadKanbanData = useCallback(async () => {
    setLoading(true);
    try {
      const kanbanColumns = await kanbanService.getKanbanColumns();
      setColumns(kanbanColumns);
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  useEffect(() => {
    loadKanbanData();
  }, [loadKanbanData]);

  const handleMoveJob = useCallback(async (jobId: number, toColumnId: number) => {
    setLoading(true);
    try {
      await kanbanService.moveCard(jobId, toColumnId, 0);
      await loadKanbanData();
    } finally {
      setLoading(false);
    }
  }, [setLoading, loadKanbanData]);

  const handleAddJob = useCallback(() => {
    // TODO: Implémenter l'ajout d'une nouvelle offre
    console.log('Ajouter une nouvelle offre');
  }, []);

  const columnComponents = useMemo(() => 
    columns.map((column, index) => {
      const nextColumn = columns[index + 1];
      return (
        <Grid.Col key={column.id} span={3}>
          <KanbanColumn
            column={column}
            onMoveJob={handleMoveJob}
            nextColumnId={nextColumn?.id}
          />
        </Grid.Col>
      );
    }), [columns, handleMoveJob]);

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Text size="xl" fw={700}>Suivi des Candidatures</Text>
        <Button 
          leftSection={<IconPlus size={16} />} 
          variant="light"
          onClick={handleAddJob}
        >
          Ajouter une offre
        </Button>
      </Group>

      <Grid gutter="xl">
        {columnComponents}
      </Grid>
    </Container>
  );
}