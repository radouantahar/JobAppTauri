/// <reference types="vitest" />
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchResults } from '../SearchResults';
import type { Job, JobType, JobSource, ExperienceLevel, ISODateString } from '../../../types';

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
      type: 'CDI',
      postedAt: toISODateString('2024-03-20T00:00:00.000Z'),
      experience: 'mid',
      description: 'Description du poste',
      url: 'https://example.com/job',
      source: 'linkedin' as JobSource,
      jobType: 'full-time' as JobType,
      experienceLevel: 'mid' as ExperienceLevel,
      salary: {
        min: 45000,
        max: 55000,
        currency: 'EUR',
        period: 'year'
      },
      matchingScore: 0.95,
      skills: ['React', 'TypeScript', 'Node.js'],
      commuteTimes: [
        {
          mode: 'transit',
          duration: 30,
          distance: 5
        }
      ],
      remote: true,
      contractType: 'CDI',
      createdAt: '2024-03-20T00:00:00.000Z'
    },
    {
      id: '2',
      title: 'Frontend Developer',
      company: 'WebCorp',
      location: 'Lyon',
      type: 'CDI',
      postedAt: toISODateString('2024-03-19T00:00:00.000Z'),
      experience: 'senior',
      description: 'Description du poste',
      url: 'https://example.com/job2',
      source: 'indeed' as JobSource,
      jobType: 'full-time' as JobType,
      experienceLevel: 'senior' as ExperienceLevel,
      salary: {
        min: 50000,
        max: 65000,
        currency: 'EUR',
        period: 'year'
      },
      matchingScore: 0.85,
      skills: ['React', 'TypeScript', 'CSS'],
      commuteTimes: [
        {
          mode: 'driving',
          duration: 45,
          distance: 8
        }
      ],
      remote: false,
      contractType: 'CDI',
      createdAt: '2024-03-19T00:00:00.000Z'
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
    expect(screen.getByText('50 000 - 65 000 EUR/year')).toBeInTheDocument();
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