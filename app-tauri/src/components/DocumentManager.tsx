import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Container,
  Title,
  Group,
  Button,
  Text,
  Stack,
  Card,
  Badge,
  ActionIcon,
  Menu,
  Loader,
} from '@mantine/core';
import { IconUpload, IconDots, IconEdit, IconTrash, IconDownload } from '@tabler/icons-react';
import { FixedSizeList as List } from 'react-window';
import { Document } from '../types/documents';
import { useTauri } from '../hooks/useTauri';
import { DocumentForm } from './DocumentForm';
import styles from '../styles/components/DocumentManager.module.css';

interface DocumentManagerProps {
  onDocumentUpload?: (document: Document) => void;
  onDocumentDelete?: (documentId: string) => void;
}

const ITEM_HEIGHT = 120;
const ITEM_PADDING = 16;
const DOCUMENTS_PER_PAGE = 10;
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  onDocumentUpload,
  onDocumentDelete,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Partial<Document>>({});
  const [loading, setLoading] = useState(false);
  const [page] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { invoke } = useTauri();
  const cacheRef = useRef<{
    data: Document[];
    timestamp: number;
  }>({ data: [], timestamp: 0 });

  const loadDocuments = useCallback(async (pageNum: number = 1) => {
    try {
      // Vérifier le cache
      const now = Date.now();
      if (pageNum === 1 && cacheRef.current.data.length > 0 && 
          now - cacheRef.current.timestamp < CACHE_EXPIRY) {
        setDocuments(cacheRef.current.data);
        return;
      }

      setLoading(true);
      const response = await invoke<Document[]>('get_documents', {
        page: pageNum,
        limit: DOCUMENTS_PER_PAGE,
      });
      
      if (response.length < DOCUMENTS_PER_PAGE) {
        setHasMore(false);
      }

      const newDocuments = pageNum === 1 ? response : [...documents, ...response];
      setDocuments(newDocuments);

      // Mettre à jour le cache
      if (pageNum === 1) {
        cacheRef.current = {
          data: newDocuments,
          timestamp: now,
        };
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }, [invoke, documents]);

  // Chargement initial avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDocuments();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadDocuments]);

  const handleSubmit = useCallback(async (document: Partial<Document>) => {
    try {
      setLoading(true);
      if (selectedDocument) {
        // Modification
        await invoke('update_document', {
          id: selectedDocument.id,
          ...document,
        });
      } else {
        // Création
        const newDocument = await invoke<Document>('upload_document', document);
        onDocumentUpload?.(newDocument);
      }
      
      setIsModalOpen(false);
      setSelectedDocument({});
      // Invalider le cache
      cacheRef.current = { data: [], timestamp: 0 };
      loadDocuments(1);
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDocument, invoke, loadDocuments, onDocumentUpload]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await invoke('delete_document', { id });
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      // Mettre à jour le cache
      cacheRef.current.data = cacheRef.current.data.filter(doc => doc.id !== id);
      onDocumentDelete?.(id);
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setLoading(false);
    }
  }, [invoke, onDocumentDelete]);

  const handleDownload = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await invoke('download_document', { id });
    } catch (error) {
      console.error('Error downloading document:', error);
    } finally {
      setLoading(false);
    }
  }, [invoke]);

  const handleEdit = useCallback((document: Document) => {
    setSelectedDocument(document);
    setIsModalOpen(true);
  }, []);

  const DocumentRow = useMemo(() => React.memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const document = documents[index];
    
    if (index === documents.length - 5 && hasMore && !loading) {
      loadDocuments(page + 1);
    }

    return (
      <div style={{ ...style, padding: `${ITEM_PADDING}px 0` }}>
        <Card withBorder className={styles.documentCard}>
          <Group justify="space-between">
            <Stack gap="xs">
              <Text fw={500}>{document.name}</Text>
              <Badge color="blue">{document.type}</Badge>
              {document.description && <Text size="sm" c="dimmed">{document.description}</Text>}
            </Stack>
            <Menu position="bottom-end">
              <Menu.Target>
                <ActionIcon>
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconDownload size={14} />} onClick={() => handleDownload(document.id)}>
                  Télécharger
                </Menu.Item>
                <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => handleEdit(document)}>
                  Modifier
                </Menu.Item>
                <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => handleDelete(document.id)}>
                  Supprimer
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Card>
      </div>
    );
  }), [documents, handleDelete, handleDownload, handleEdit, hasMore, loading, loadDocuments, page]);

  return (
    <Container size="xl" className={styles.container}>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Gestion des Documents</Title>
        <Button
          leftSection={<IconUpload size={16} />}
          onClick={() => setIsModalOpen(true)}
        >
          Ajouter un document
        </Button>
      </Group>

      {loading && documents.length === 0 ? (
        <div className={styles.loadingOverlay}>
          <Loader size="md" />
        </div>
      ) : (
        <>
          <List
            height={600}
            itemCount={documents.length}
            itemSize={ITEM_HEIGHT + ITEM_PADDING * 2}
            width="100%"
          >
            {DocumentRow}
          </List>
          {loading && documents.length > 0 && (
            <div className={styles.loadingIndicator}>
              <Loader size="sm" />
            </div>
          )}
        </>
      )}

      <DocumentForm
        opened={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDocument({});
        }}
        onSubmit={handleSubmit}
        initialValues={selectedDocument}
      />
    </Container>
  );
};

export default DocumentManager; 