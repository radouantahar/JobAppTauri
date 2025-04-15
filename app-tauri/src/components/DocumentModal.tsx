import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDocument } from '../hooks/useDocument';

interface DocumentModalProps {
  documentId: string;
  onClose: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ documentId, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { document, isLoading, error, updateDocument, deleteDocument } = useDocument(documentId);

  if (!isAuthenticated) return null;
  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;
  if (!document) return null;

  return (
    <div className="document-modal">
      <h2>{document.title}</h2>
      <p>{document.content}</p>
      <button onClick={() => updateDocument()}>Mettre à jour</button>
      <button onClick={() => deleteDocument()}>Supprimer</button>
      <button onClick={onClose}>Fermer</button>
    </div>
  );
}; 