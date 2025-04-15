import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useJob } from '../hooks/useJob';

interface JobModalProps {
  jobId: string;
  onClose: () => void;
}

export const JobModal: React.FC<JobModalProps> = ({ jobId, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { job, isLoading, error, applyToJob, saveJob } = useJob(jobId);

  if (!isAuthenticated) return null;
  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;
  if (!job) return null;

  return (
    <div className="job-modal">
      <h2>{job.title}</h2>
      <p>{job.company} - {job.location}</p>
      <p>{job.description}</p>
      <button onClick={applyToJob}>Postuler</button>
      <button onClick={saveJob}>Sauvegarder</button>
      <button onClick={onClose}>Fermer</button>
    </div>
  );
}; 