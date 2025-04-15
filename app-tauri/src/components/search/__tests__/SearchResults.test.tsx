/// <reference types="vitest" />
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchResults } from '../SearchResults';
import type { Job, JobType, JobSource, ExperienceLevel, Currency, SalaryPeriod, CommuteMode, ISODateString } from '../../../types';

// Fonction utilitaire pour convertir une chaîne en ISODateString
const toISODateString = (date: string): ISODateString => date as ISODateString;

vi.mock('../../JobCard', () => ({
  JobCard: ({ job }: { job: Job }) => <div data-testid={`job-card-${job.id}`}>{job.title}</div>
}));

describe('SearchResults', () => {
  const mockJobs: Job[] = [
    {
      id: '1',
      title: 'Développeur React',
      company: 'TechCorp',
      location: 'Paris',
      description: 'Description du poste',
      url: 'https://example.com/job',
      source: 'linkedin' as JobSource,
      publishedAt: toISODateString('2024-03-20T00:00:00.000Z'),
      jobType: 'full-time' as JobType,
      experienceLevel: 'mid' as ExperienceLevel,
      matchingScore: 0.95,
      commuteTimes: {
        primaryHome: {
          duration: 30,
          distance: 5,
          mode: 'transit' as CommuteMode
        }
      },
      salary: {
        min: 45000,
        max: 55000,
        currency: 'EUR' as Currency,
        period: 'year' as SalaryPeriod
      },
      skills: ['React', 'TypeScript', 'Node.js']
    },
    {
      id: '2',
      title: 'Frontend Developer',
      company: 'WebCorp',
      location: 'Lyon',
      description: 'Description du poste',
      url: 'https://example.com/job2',
      source: 'indeed' as JobSource,
      publishedAt: toISODateString('2024-03-19T00:00:00.000Z'),
      jobType: 'full-time' as JobType,
      experienceLevel: 'senior' as ExperienceLevel,
      matchingScore: 0.85,
      commuteTimes: {
        primaryHome: {
          duration: 45,
          distance: 8,
          mode: 'transit' as CommuteMode
        }
      },
      salary: {
        min: 55000,
        max: 70000,
        currency: 'EUR' as Currency,
        period: 'year' as SalaryPeriod
      },
      skills: ['Vue.js', 'JavaScript', 'CSS']
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders job cards correctly', () => {
    render(
      <SearchResults
        jobs={mockJobs}
        isLoading={false}
        hasMore={false}
        onJobClick={() => {}}
        loadMoreRef={() => {}}
      />
    );
    
    expect(screen.getByText('Développeur React')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
  });

  it('calls onJobClick when a job card is clicked', () => {
    const handleJobClick = vi.fn();
    render(
      <SearchResults
        jobs={mockJobs}
        isLoading={false}
        hasMore={false}
        onJobClick={handleJobClick}
        loadMoreRef={() => {}}
      />
    );
    
    fireEvent.click(screen.getByText('Développeur React'));
    expect(handleJobClick).toHaveBeenCalledWith(mockJobs[0]);
  });

  it('displays matching score when provided', () => {
    render(
      <SearchResults
        jobs={mockJobs}
        isLoading={false}
        hasMore={false}
        onJobClick={() => {}}
        loadMoreRef={() => {}}
      />
    );
    
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('shows salary information when available', () => {
    render(
      <SearchResults
        jobs={mockJobs}
        isLoading={false}
        hasMore={false}
        onJobClick={() => {}}
        loadMoreRef={() => {}}
      />
    );
    
    expect(screen.getByText('45 000 - 55 000 EUR/year')).toBeInTheDocument();
    expect(screen.getByText('55 000 - 70 000 EUR/year')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <SearchResults
        jobs={[]}
        isLoading={true}
        hasMore={false}
        onJobClick={() => {}}
        loadMoreRef={() => {}}
      />
    );
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should show empty state', () => {
    render(
      <SearchResults
        jobs={[]}
        isLoading={false}
        hasMore={false}
        onJobClick={() => {}}
        loadMoreRef={() => {}}
      />
    );
    expect(screen.getByText('Aucune offre trouvée')).toBeInTheDocument();
  });

  it('devrait afficher les cartes de jobs quand il y a des résultats', () => {
    render(
      <SearchResults
        jobs={mockJobs}
        isLoading={false}
        hasMore={false}
        onJobClick={() => {}}
        loadMoreRef={() => {}}
      />
    );
    
    expect(screen.getByTestId('job-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('job-card-2')).toBeInTheDocument();
    expect(screen.getByText('Développeur React')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
  });

  it('devrait appeler onJobClick avec le bon job lors du clic', () => {
    const handleJobClick = vi.fn();
    render(
      <SearchResults
        jobs={mockJobs}
        isLoading={false}
        hasMore={false}
        onJobClick={handleJobClick}
        loadMoreRef={() => {}}
      />
    );
    
    fireEvent.click(screen.getByText('Développeur React'));
    expect(handleJobClick).toHaveBeenCalledWith(mockJobs[0]);
  });
}); 