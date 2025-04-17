import React from 'react';
import { Job } from '../types/job';

interface JobCardProps {
  job: Job;
  onRemoveFavorite?: () => void;
  isFavorite?: boolean;
  onClick?: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onRemoveFavorite, isFavorite = false, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick?.(job)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
          <p className="text-gray-600">{job.company}</p>
        </div>
        {isFavorite && onRemoveFavorite && (
          <button
            onClick={onRemoveFavorite}
            className="text-red-500 hover:text-red-700"
            title="Retirer des favoris"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="mt-2">
        <p className="text-sm text-gray-500">{job.location}</p>
        <p className="text-sm text-gray-500">{job.type}</p>
      </div>
      <div className="mt-4">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Voir l'offre
        </a>
      </div>
    </div>
  );
};