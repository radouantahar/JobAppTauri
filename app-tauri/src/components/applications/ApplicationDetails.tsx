import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Application, ApplicationStage, ApplicationDocument, ApplicationNote } from '../../types';

interface ApplicationDetailsProps {
  applicationId: number;
}

export const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({ applicationId }) => {
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const app = await invoke<Application>('get_application', { applicationId });
        setApplication(app);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplication();
  }, [applicationId]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const success = await invoke<boolean>('update_application_status', {
        applicationId,
        status: newStatus,
      });

      if (success && application) {
        setApplication({ ...application, status: newStatus });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleAddStage = async (stageType: string) => {
    try {
      const newStage = await invoke<ApplicationStage>('add_application_stage', {
        applicationId,
        stageType,
      });

      if (application) {
        setApplication({
          ...application,
          stages: [...(application.stages || []), newStage],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleAddNote = async (content: string) => {
    try {
      const newNote = await invoke<ApplicationNote>('add_application_note', {
        applicationId,
        content,
      });

      if (application) {
        setApplication({
          ...application,
          application_notes: [...(application.application_notes || []), newNote],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!application) {
    return <div>Aucune candidature trouvée</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Détails de la candidature</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Statut</label>
          <select
            value={application.status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="applied">Candidature envoyée</option>
            <option value="interview">Entretien</option>
            <option value="offer">Offre reçue</option>
            <option value="rejected">Refusé</option>
            <option value="accepted">Accepté</option>
          </select>
        </div>

        {application.notes && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <p className="mt-1 text-gray-900">{application.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Étapes</h3>
        <div className="space-y-4">
          {application.stages?.map((stage) => (
            <div key={stage.id} className="border rounded-lg p-4">
              <p className="font-medium">{stage.stage_type}</p>
              {stage.scheduled_at && (
                <p className="text-sm text-gray-600">
                  Planifié le: {new Date(stage.scheduled_at).toLocaleDateString()}
                </p>
              )}
              {stage.notes && <p className="mt-2 text-gray-700">{stage.notes}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Notes</h3>
        <div className="space-y-4">
          {application.application_notes?.map((note) => (
            <div key={note.id} className="border rounded-lg p-4">
              <p className="text-gray-700">{note.content}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(note.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 