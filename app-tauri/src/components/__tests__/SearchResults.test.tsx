import { render, screen } from '@testing-library/react';
import { SearchResults } from '../search/SearchResults';
import type { Job } from '../../types';
import { ISODateString } from '../../types';

const mockJob1: Job = {
  id: '1',
  title: 'Développeur React',
  company: 'TechCorp',
  location: 'Paris',
  description: 'Description du poste',
  url: 'https://example.com/job',
  source: 'linkedin',
  publishedAt: '2024-03-20T00:00:00.000Z' as ISODateString,
  jobType: 'full-time',
  experienceLevel: 'mid',
  skills: ['React', 'TypeScript'],
  salary: {
    min: 45000,
    max: 55000,
    currency: 'EUR',
    period: 'year'
  },
  matchingScore: 0.85,
  commuteTimes: {
    primaryHome: {
      duration: 30,
      distance: 5,
      mode: 'transit'
    }
  }
};

const mockJob2: Job = {
  id: '2',
  title: 'Développeur Full Stack',
  company: 'DevCorp',
  location: 'Lyon',
  description: 'Description du poste',
  url: 'https://example.com/job2',
  source: 'linkedin',
  publishedAt: '2024-03-19T00:00:00.000Z' as ISODateString,
  jobType: 'full-time',
  experienceLevel: 'senior',
  skills: ['React', 'Node.js', 'TypeScript'],
  salary: {
    min: 55000,
    max: 65000,
    currency: 'EUR',
    period: 'year'
  },
  matchingScore: 0.75,
  commuteTimes: {
    primaryHome: {
      duration: 45,
      distance: 8,
      mode: 'transit'
    }
  }
};

describe('SearchResults', () => {
  const loadMoreRef = () => {};

  it('devrait afficher les cartes d\'offres', () => {
    render(
      <SearchResults
        jobs={[mockJob1, mockJob2]}
        isLoading={false}
        hasMore={false}
        onJobClick={() => {}}
        loadMoreRef={loadMoreRef}
      />
    );

    expect(screen.getByText('Développeur React')).toBeInTheDocument();
    expect(screen.getByText('Développeur Full Stack')).toBeInTheDocument();
  });

  it('devrait afficher l\'état de chargement', () => {
    render(
      <SearchResults
        jobs={[]}
        isLoading={true}
        hasMore={false}
        onJobClick={() => {}}
        loadMoreRef={loadMoreRef}
      />
    );

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('devrait afficher l\'état vide', () => {
    render(
      <SearchResults
        jobs={[]}
        isLoading={false}
        hasMore={false}
        onJobClick={() => {}}
        loadMoreRef={loadMoreRef}
      />
    );

    expect(screen.getByText('Aucune offre trouvée')).toBeInTheDocument();
  });
}); 