/// <reference types="vitest" />
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchResults } from '../SearchResults';
import type { Job, JobType, JobSource, ExperienceLevel, Salary } from '../../../types/job';
import { toISODateString } from '../../../types/core/date';

vi.mock('../../JobCard', () => ({
  JobCard: ({ job }: { job: Job }) => <div data-testid={`job-card-${job.id}`}>{job.title}</div>
}));

describe('SearchResults', () => {
  const mockJobs: Job[] = [
    {
      id: '1',
      title: 'Développeur Full Stack',
      company: 'Tech Corp',
      location: 'Paris',
      type: 'CDI' as JobType,
      postedAt: toISODateString(new Date('2024-03-20')),
      experienceLevel: 'mid' as ExperienceLevel,
      salary: {
        min: 40000,
        max: 60000,
        currency: 'EUR',
        period: 'year'
      } as Salary,
      description: 'Description du poste',
      url: 'https://example.com/job/1',
      remote: true,
      skills: ['React', 'Node.js'],
      jobType: 'CDI' as JobType,
      commuteTimes: [],
      source: 'linkedin' as JobSource
    },
    {
      id: '2',
      title: 'Développeur Frontend',
      company: 'Web Inc',
      location: 'Lyon',
      type: 'CDI' as JobType,
      postedAt: '2024-03-19',
      experienceLevel: 'senior' as ExperienceLevel,
      salary: {
        min: 50000,
        max: 70000,
        currency: 'EUR',
        period: 'year'
      } as Salary,
      description: 'Description du poste',
      url: 'https://example.com/job/2',
      remote: false,
      skills: ['React', 'TypeScript'],
      jobType: 'CDI' as JobType,
      commuteTimes: [],
      source: 'indeed' as JobSource
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
    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
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