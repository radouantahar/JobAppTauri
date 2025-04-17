import { useState } from 'react';
import { Modal, TextInput, Textarea, Select, FileInput, Button, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Document, DocumentType, DOCUMENT_TYPES } from '../types';

interface DocumentFormProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (document: Omit<Document, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  initialValues?: Partial<Document>;
}

const documentTypes: { value: DocumentType; label: string }[] = [
  { value: 'cv', label: 'CV' },
  { value: 'cover-letter', label: 'Lettre de motivation' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'other', label: 'Autre' },
];

export function DocumentForm({ opened, onClose, onSubmit, initialValues }: DocumentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileSize, setFileSize] = useState(0);

  const form = useForm<Omit<Document, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>({
    initialValues: {
      name: initialValues?.name || '',
      type: initialValues?.type || 'cv',
      description: initialValues?.description || '',
      content: initialValues?.content || '',
      size: initialValues?.size || 0,
      url: initialValues?.url || '',
      filePath: initialValues?.filePath || '',
    },
    validate: {
      name: (value: string) => (!value ? 'Le nom est requis' : null),
      type: (value: DocumentType) => (!DOCUMENT_TYPES.includes(value) ? 'Type de document invalide' : null),
      size: (value: number) => (value === 0 ? 'Le fichier est requis' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true);
    try {
      await onSubmit({
        name: values.name,
        type: values.type,
        description: values.description,
        content: values.content,
        size: values.size,
        url: values.url,
        filePath: values.filePath,
      });
      form.reset();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission du document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Ajouter un document" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Nom"
            placeholder="Nom du document"
            required
            {...form.getInputProps('name')}
          />

          <Select
            label="Type de document"
            placeholder="Sélectionnez un type"
            data={documentTypes}
            required
            {...form.getInputProps('type')}
          />

          <Textarea
            label="Description"
            placeholder="Description du document"
            {...form.getInputProps('description')}
          />

          <FileInput
            label="Fichier"
            placeholder="Sélectionnez un fichier"
            accept=".pdf,.doc,.docx"
            required
            onChange={(file) => {
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const content = e.target?.result as string;
                  form.setFieldValue('content', content);
                  form.setFieldValue('url', URL.createObjectURL(file));
                  form.setFieldValue('filePath', file.name);
                  form.setFieldValue('size', file.size);
                  setFileSize(file.size);
                };
                reader.readAsText(file);
              }
            }}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={isLoading}>
              Enregistrer
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
} 