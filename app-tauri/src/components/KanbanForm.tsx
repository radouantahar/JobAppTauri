import { useState } from 'react';
import { Stack, TextInput, Textarea, Button, Group } from '@mantine/core';
import type { KanbanCard } from '../types/index';
import { createISODateString } from '../types/core';

interface KanbanFormProps {
  initialData?: Partial<KanbanCard>;
  onSubmit: (data: Partial<KanbanCard>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const KanbanForm = ({ initialData, onSubmit, onCancel, isLoading }: KanbanFormProps) => {
  const [formData, setFormData] = useState<Partial<KanbanCard>>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    notes: initialData?.notes || '',
    status: initialData?.status || 'saved',
    interviews: initialData?.interviews || [],
    createdAt: initialData?.createdAt || createISODateString(new Date().toISOString()),
    updatedAt: initialData?.updatedAt || createISODateString(new Date().toISOString()),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Titre"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          minRows={3}
        />
        <Textarea
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          minRows={3}
        />
        <Group justify="flex-end">
          {onCancel && (
            <Button variant="default" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button type="submit" loading={isLoading}>
            Enregistrer
          </Button>
        </Group>
      </Stack>
    </form>
  );
}; 