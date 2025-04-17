import { useState, useCallback, memo } from 'react';
import { 
  Card, 
  Text, 
  Group, 
  ActionIcon, 
  Menu, 
  rem, 
  Notification,
  Stack,
  LoadingOverlay,
  Badge
} from '@mantine/core';
import { 
  IconDots, 
  IconShare, 
  IconDownload, 
  IconEdit, 
  IconTrash, 
  IconFileText,
  IconX,
  IconFileTypePdf,
  IconFileTypeDoc,
  IconFileTypeCsv
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { documentService } from '../services/api';
import type { Document } from '../types';
import classes from '../styles/components/DocumentList.module.css';

const DOCUMENT_TYPE_ICONS = {
  'pdf': IconFileTypePdf,
  'doc': IconFileTypeDoc,
  'csv': IconFileTypeCsv,
  'default': IconFileText,
};

interface DocumentListProps {
  documents: Document[];
  onDelete?: (documentId: string) => void;
  onEdit?: (document: Document) => void;
  onShare?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  isLoading: boolean;
}

const DocumentCard = memo(function DocumentCard({ 
  document,
  onDelete,
  onEdit,
  onShare,
  onDownload
}: { 
  document: Document;
  onDelete?: (documentId: string) => void;
  onEdit?: (document: Document) => void;
  onShare?: (document: Document) => void;
  onDownload?: (document: Document) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAppStore();

  const handleDelete = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await documentService.deleteDocument(document.id);
      onDelete?.(document.id);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Erreur lors de la suppression du document');
    } finally {
      setIsLoading(false);
    }
  }, [document.id, isAuthenticated, onDelete, navigate]);

  const handleShare = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    try {
      await navigator.share({
        title: document.name,
        text: document.description,
        url: document.url || window.location.href,
      });
      onShare?.(document);
    } catch (err) {
      console.error('Error sharing:', err);
      // L'erreur est normale si l'utilisateur annule le partage
    }
  }, [document, isAuthenticated, onShare, navigate]);

  const handleDownload = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (document.url) {
        window.open(document.url, '_blank');
        onDownload?.(document);
      } else {
        setError('URL du document non disponible');
      }
    } catch (err) {
      console.error('Error downloading:', err);
      setError('Erreur lors du téléchargement du document');
    } finally {
      setIsLoading(false);
    }
  }, [document, isAuthenticated, onDownload, navigate]);

  const handleEdit = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    onEdit?.(document);
  }, [document, isAuthenticated, onEdit, navigate]);

  const DocumentTypeIcon = DOCUMENT_TYPE_ICONS[document.type as keyof typeof DOCUMENT_TYPE_ICONS] || DOCUMENT_TYPE_ICONS.default;

  return (
    <Card withBorder radius="md" className={classes.card}>
      <LoadingOverlay visible={isLoading} />
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group gap={4}>
            <DocumentTypeIcon size={16} />
            <Text fw={500}>{document.name}</Text>
          </Group>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit style={{ width: rem(14), height: rem(14) }} />}
                onClick={handleEdit}
                disabled={!isAuthenticated}
              >
                Modifier
              </Menu.Item>
              <Menu.Item
                leftSection={<IconShare style={{ width: rem(14), height: rem(14) }} />}
                onClick={handleShare}
                disabled={!isAuthenticated}
              >
                Partager
              </Menu.Item>
              <Menu.Item
                leftSection={<IconDownload style={{ width: rem(14), height: rem(14) }} />}
                onClick={handleDownload}
                disabled={!isAuthenticated}
              >
                Télécharger
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
                onClick={handleDelete}
                disabled={!isAuthenticated}
              >
                Supprimer
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Card.Section>

      <Text fz="sm" c="dimmed" mt="sm">
        {document.description}
      </Text>

      <Group gap="xs" mt="md">
        <Badge variant="light">
          {document.type.toUpperCase()}
        </Badge>
        {document.createdAt && (
          <Badge variant="light" color="gray">
            {new Date(document.createdAt).toLocaleDateString('fr-FR')}
          </Badge>
        )}
      </Group>

      {error && (
        <Notification
          icon={<IconX size={18} />}
          color="red"
          title="Erreur"
          mt="sm"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Notification>
      )}
    </Card>
  );
});

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDelete,
  onEdit,
  isLoading
}) => {

  return (
    <Stack>
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
      {isLoading && <LoadingOverlay visible />}
    </Stack>
  );
}; 