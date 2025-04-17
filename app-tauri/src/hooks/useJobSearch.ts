import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useAuth } from './useAuth';
import type { Job, SearchFilters, Document } from '../types';

interface UseJobSearchResult {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  search: (filters: SearchFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  uploadDocument: (file: File) => Promise<Document>;
  deleteDocument: (documentId: string) => Promise<void>;
  getDocuments: () => Promise<Document[]>;
  saveJob: (job: Job) => Promise<void>;
}

export const useJobSearch = (): UseJobSearchResult => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const search = useCallback(async (filters: SearchFilters) => {
    if (!user) {
      setError('Vous devez être connecté pour effectuer une recherche');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPage(1);

    try {
      const results = await invoke<Job[]>('search_jobs', {
        filters,
        page: 1,
        userId: user.id
      });
      setJobs(results);
      setHasMore(results.length === 10); // Supposons que nous affichons 10 résultats par page
    } catch (err) {
      setError('Erreur lors de la recherche d\'emplois');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadMore = useCallback(async () => {
    if (!user || isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const results = await invoke<Job[]>('search_jobs', {
        filters: {}, // TODO: Conserver les filtres actuels
        page: nextPage,
        userId: user.id
      });
      setJobs(prev => [...prev, ...results]);
      setPage(nextPage);
      setHasMore(results.length === 10);
    } catch (err) {
      setError('Erreur lors du chargement des résultats supplémentaires');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoading, hasMore, page]);

  const uploadDocument = useCallback(async (file: File): Promise<Document> => {
    if (!user) {
      throw new Error('Vous devez être connecté pour uploader des documents');
    }

    try {
      // TODO: Implémenter l'upload du fichier via Tauri
      const document = await invoke<Document>('upload_document', {
        userId: user.id,
        name: file.name,
        documentType: file.type,
        size: file.size,
        filePath: '' // TODO: Obtenir le chemin du fichier après l'upload
      });
      return document;
    } catch (err) {
      console.error(err);
      throw new Error('Erreur lors de l\'upload du document');
    }
  }, [user]);

  const deleteDocument = useCallback(async (documentId: string): Promise<void> => {
    if (!user) {
      throw new Error('Vous devez être connecté pour supprimer des documents');
    }

    try {
      await invoke('delete_document', { documentId });
    } catch (err) {
      console.error(err);
      throw new Error('Erreur lors de la suppression du document');
    }
  }, [user]);

  const getDocuments = useCallback(async (): Promise<Document[]> => {
    if (!user) {
      throw new Error('Vous devez être connecté pour récupérer les documents');
    }

    try {
      return await invoke<Document[]>('get_user_documents', { userId: user.id });
    } catch (err) {
      console.error(err);
      throw new Error('Erreur lors de la récupération des documents');
    }
  }, [user]);

  const saveJob = useCallback(async (job: Job): Promise<void> => {
    if (!user) {
      throw new Error('Vous devez être connecté pour sauvegarder un emploi');
    }

    try {
      await invoke('save_job', { jobId: job.id, userId: user.id });
    } catch (err) {
      console.error(err);
      throw new Error('Erreur lors de la sauvegarde de l\'emploi');
    }
  }, [user]);

  return {
    jobs,
    isLoading,
    error,
    hasMore,
    search,
    loadMore,
    uploadDocument,
    deleteDocument,
    getDocuments,
    saveJob
  };
}; 