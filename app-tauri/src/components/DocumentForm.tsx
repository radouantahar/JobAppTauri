import React from 'react';
import { TextInput, Textarea, Select, Button, Stack, LoadingOverlay, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DocumentType } from '../types';

interface DocumentFormProps {
  initialData?: {
    title: string;
    content: string;
    type: DocumentType;
  };
  isLoading?: boolean;
  error?: string;
  onSubmit?: (values: { title: string; content: string; type: DocumentType }) => void;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({
  initialData,
  isLoading = false,
  error,
  onSubmit,
}) => {
  const form = useForm({
    initialValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
      type: initialData?.type || 'cv' as DocumentType,
    },
    validate: {
      title: (value) => (value.length < 1 ? 'Le titre est requis' : null),
      content: (value) => (value.length < 1 ? 'Le contenu est requis' : null),
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    onSubmit?.(values);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md" pos="relative">
        <LoadingOverlay visible={isLoading} />
        
        {error && (
          <Alert color="red" title="Erreur">
            {error}
          </Alert>
        )}

        <TextInput
          required
          label="Titre"
          placeholder="Entrez le titre du document"
          {...form.getInputProps('title')}
        />

        <Textarea
          required
          label="Contenu"
          placeholder="Entrez le contenu du document"
          minRows={4}
          {...form.getInputProps('content')}
        />

        <Select
          label="Type de document"
          placeholder="Sélectionnez le type de document"
          data={[
            { value: 'cv', label: 'CV' },
            { value: 'cover_letter', label: 'Lettre de motivation' },
            { value: 'portfolio', label: 'Portfolio' },
          ]}
          {...form.getInputProps('type')}
        />

        <Button type="submit" disabled={isLoading}>
          Enregistrer
        </Button>
      </Stack>
    </form>
  );
}; 