import React from 'react';
import { Container, Title, Stack } from '@mantine/core';
import { DocumentManager } from '../components/DocumentManager';
import type { Document } from '../types';

const Documents: React.FC = () => {
  const handleDocumentUpload = (document: Document) => {
    console.log('Document uploadé:', document);
    // TODO: Implémenter la logique de sauvegarde
  };

  const handleDocumentDelete = (documentId: string) => {
    console.log('Document supprimé:', documentId);
    // TODO: Implémenter la logique de suppression
  };

  return (
    <Container size="xl">
      <Stack gap="md">
        <Title order={1}>Mes documents</Title>
        <DocumentManager
          onDocumentUpload={handleDocumentUpload}
          onDocumentDelete={handleDocumentDelete}
        />
      </Stack>
    </Container>
  );
};

export default Documents;