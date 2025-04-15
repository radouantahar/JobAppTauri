import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Document } from '../types';

export const useDocument = (documentId: string) => {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await invoke('get_document', { documentId });
      setDocument(result as Document);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement'));
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  const updateDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      await invoke('update_document', { documentId });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la mise à jour'));
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  const deleteDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      await invoke('delete_document', { documentId });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la suppression'));
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  return { document, isLoading, error, fetchDocument, updateDocument, deleteDocument };
}; 