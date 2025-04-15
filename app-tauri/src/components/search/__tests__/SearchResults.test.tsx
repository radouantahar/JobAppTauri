/// <reference types="vitest" />
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchResults } from '../SearchResults';
import type { Job } from '../../../types';

vi.mock('../../JobCard', () => ({
  JobCard: ({ job, onClick }: { job: Job; onClick: () => void }) => (
    <div data-testid={`job-card-${job.id}`} onClick={onClick}>
      {job.title}
    </div>
  ),
}));

describe('SearchResults', () => {
  const mockJob: Job = {
    id: 1 as number & { readonly __brand: 'JobID' },
    title: 'Développeur React',
    company: 'TechCorp',
    location: 'Paris',
    description: 'Description du poste',
    url: 'https://example.com',
    source: 'linkedin',
    publishedAt: '2024-03-20T10:00:00Z' as string & { readonly __brand: 'ISODateString' },
    matchingScore: 0.8,
    commuteTimes: {
      primaryHome: {
        duration: 30,
        distance: 5,
        mode: 'transit'
      }
    }
  };

  const defaultProps = {
    jobs: [] as Job[],
    isLoading: false,
    hasMore: false,
    onJobClick: vi.fn(),
    loadMoreRef: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher le message "Aucune offre trouvée" quand il n\'y a pas de résultats', () => {
    render(<SearchResults {...defaultProps} />);
    
    expect(screen.getByText('Aucune offre trouvée')).toBeInTheDocument();
  });

  it('devrait afficher les cartes de jobs quand il y a des résultats', () => {
    const jobs = [
      mockJob,
      { ...mockJob, id: 2 as number & { readonly __brand: 'JobID' }, title: 'Développeur Vue' }
    ];
    render(<SearchResults {...defaultProps} jobs={jobs} />);
    
    expect(screen.getByTestId('job-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('job-card-2')).toBeInTheDocument();
    expect(screen.getByText('Développeur React')).toBeInTheDocument();
    expect(screen.getByText('Développeur Vue')).toBeInTheDocument();
  });

  it('devrait appeler onJobClick avec le bon job lors du clic', () => {
    render(<SearchResults {...defaultProps} jobs={[mockJob]} />);
    
    const jobCard = screen.getByTestId('job-card-1');
    jobCard.click();
    
    expect(defaultProps.onJobClick).toHaveBeenCalledWith(mockJob);
  });

  it('devrait afficher le LoadingOverlay quand hasMore est true', () => {
    render(<SearchResults {...defaultProps} jobs={[mockJob]} hasMore={true} isLoading={true} />);
    
    const loadingElement = screen.getByRole('presentation');
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveStyle({ opacity: 1 });
  });

  // Test des cas limites
  it('ne devrait pas afficher le message "Aucune offre trouvée" pendant le chargement', () => {
    render(<SearchResults {...defaultProps} isLoading={true} />);
    
    expect(screen.queryByText('Aucune offre trouvée')).not.toBeInTheDocument();
  });

  // Test des cas d'erreur
  it('devrait gérer les jobs avec des données minimales', () => {
    const minimalJob: Job = {
      id: 3 as number & { readonly __brand: 'JobID' },
      title: 'Titre minimal',
      company: 'Entreprise',
      location: 'Ville',
      description: 'Description minimale',
      url: 'https://example.com',
      source: 'linkedin',
      publishedAt: '2024-03-20T10:00:00Z' as string & { readonly __brand: 'ISODateString' },
      matchingScore: 0,
      commuteTimes: {
        primaryHome: {
          duration: 0,
          distance: 0,
          mode: 'transit'
        }
      }
    };
    
    render(<SearchResults {...defaultProps} jobs={[minimalJob]} />);
    
    expect(screen.getByTestId('job-card-3')).toBeInTheDocument();
  });
}); 