import React, { useEffect, useState } from 'react';
import { Job } from '../types/core';
import { ApplicationService } from '../services/applicationService';
import { JobCard } from './JobCard';

export const FavoritesManager: React.FC = () => {
  const [favorites, setFavorites] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const data = await ApplicationService.getFavorites();
        setFavorites(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des favoris:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (jobId: string) => {
    try {
      await ApplicationService.removeFromFavorites(jobId);
      setFavorites(favorites.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
    }
  };

  if (loading) {
    return <div>Chargement des favoris...</div>;
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucun favori pour le moment</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {favorites.map(job => (
        <JobCard
          key={job.id}
          job={job}
          onRemoveFavorite={() => handleRemoveFavorite(job.id)}
          isFavorite={true}
        />
      ))}
    </div>
  );
}; 