import React from 'react';
import { Modal, Button, Group, Text } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { useDocument } from '../hooks/useDocument';

interface DocumentModalProps {
  documentId: string;
  onClose: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ documentId, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { document, isLoading, error, updateDocument, deleteDocument } = useDocument(documentId);

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

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={document?.title || 'Document'}
      size="lg"
    >
      {isLoading ? (
        <Text>Chargement...</Text>
      ) : error ? (
        <Text color="red">Erreur: {error.message}</Text>
      ) : !document ? (
        <Text>Document non trouvé</Text>
      ) : (
        <>
          <Text>{document.content}</Text>
          <Group mt="xl" justify="flex-end">
            <Button onClick={handleUpdate}>Mettre à jour</Button>
            <Button color="red" onClick={handleDelete}>Supprimer</Button>
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </Group>
        </>
      )}
    </Modal>
  );
}; 