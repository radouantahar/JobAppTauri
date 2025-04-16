import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Application } from '../../types';
import { ApplicationDetails } from './ApplicationDetails';

export const ApplicationList: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const apps = await invoke<Application[]>('get_applications');
        setApplications(apps);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleApplicationSelect = (application: Application) => {
    setSelectedApplication(application);
  };

  const handleApplicationUpdate = (updatedApplication: Application) => {
    setApplications(applications.map(app => 
      app.id === updatedApplication.id ? updatedApplication : app
    ));
    setSelectedApplication(updatedApplication);
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

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Mes Candidatures</h2>
        <div className="space-y-4">
          {applications.map((application) => (
            <div
              key={application.id}
              onClick={() => handleApplicationSelect(application)}
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                selectedApplication?.id === application.id ? 'bg-indigo-50 border-indigo-500' : ''
              }`}
            >
              <h3 className="font-medium">{application.job_id}</h3>
              <p className="text-sm text-gray-600">
                Statut: {application.status}
              </p>
              <p className="text-sm text-gray-500">
                Dernière mise à jour: {new Date(application.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="w-2/3 p-4 overflow-y-auto">
        {selectedApplication ? (
          <ApplicationDetails
            applicationId={selectedApplication.id}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Sélectionnez une candidature pour voir les détails
          </div>
        )}
      </div>
    </div>
  );
}; 