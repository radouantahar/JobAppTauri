import React from 'react';
import { Box, Text, Stack, useMantineTheme } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { Draggable } from '@hello-pangea/dnd';
import { KanbanCard } from '../types/kanban';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Props pour le composant KanbanColumn
 */
interface KanbanColumnProps {
  /** Titre de la colonne */
  title: string;
  /** Liste des cartes Kanban */
  cards: KanbanCard[];
  /** Fonction appelée lors du clic sur une carte */
  onCardClick: (card: KanbanCard) => void;
}

/**
 * Composant de colonne pour le tableau Kanban
 * @param props - Les propriétés du composant
 * @returns Le composant de colonne
 */
const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, cards, onCardClick }) => {
  const theme = useMantineTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  /**
   * Formate une date en chaîne de caractères
   * @param dateString - La date à formater
   * @returns La date formatée
   */
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  };

  return (
    <Box
      p="md"
      bg={isDark ? 'dark.6' : 'gray.0'}
      style={(theme) => ({
        minWidth: 300,
        borderRadius: theme.radius.md,
      })}
    >
      <Text size="lg" fw={500} mb="md">
        {title}
      </Text>
      <Stack gap="sm">
        {cards.map((card) => (
          <Box
            key={card.id}
            onClick={() => onCardClick(card)}
            p="sm"
            bg={isDark ? 'dark.5' : 'white'}
            style={(theme) => ({
              borderRadius: theme.radius.sm,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: isDark ? theme.colors.dark[4] : theme.colors.gray[1],
              },
            })}
          >
            <Text size="sm" fw={500}>
              {card.title}
            </Text>
            <Text size="xs" c="dimmed">
              {formatDate(card.createdAt)}
            </Text>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default KanbanColumn; 