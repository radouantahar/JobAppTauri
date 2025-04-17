import React from 'react';
import { Modal, Button, Group, Text, Stack } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { useDocument } from '../hooks/useDocument';
import type { Document } from '../types';

interface DocumentModalProps {
  document: Document | null;
  opened: boolean;
  onClose: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  document,
  opened,
  onClose
}) => {
  const { isAuthenticated } = useAuth();
  const { isLoading, error, updateDocument, deleteDocument } = useDocument(document?.id || '');

  const handleUpdate = async () => {
    if (document) {
      await updateDocument();
    }
  };

  const handleDelete = async () => {
    if (document) {
      await deleteDocument();
      onClose();
    }
  };

  if (!isAuthenticated) return null;

  if (!document) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={document.name}
      size="lg"
    >
      <Stack>
        <Group>
          <Text fw={500}>Type:</Text>
          <Text>{document.type}</Text>
        </Group>
        <Group>
          <Text fw={500}>Description:</Text>
          <Text>{document.description}</Text>
        </Group>
        <Group>
          <Text fw={500}>Créé le:</Text>
          <Text>{new Date(document.createdAt).toLocaleDateString('fr-FR')}</Text>
        </Group>
        <Group>
          <Text fw={500}>Modifié le:</Text>
          <Text>{new Date(document.updatedAt).toLocaleDateString('fr-FR')}</Text>
        </Group>
        {document.content && (
          <>
            <Text fw={500}>Contenu:</Text>
            <Text>{document.content}</Text>
          </>
        )}
      </Stack>
      <Group mt="xl" justify="flex-end">
        <Button onClick={handleUpdate}>Mettre à jour</Button>
        <Button color="red" onClick={handleDelete}>Supprimer</Button>
        <Button variant="outline" onClick={onClose}>Fermer</Button>
      </Group>
    </Modal>
  );
}; 