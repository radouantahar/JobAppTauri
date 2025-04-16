import { render, screen } from '@testing-library/react';
import { JobSearchResults } from '../JobSearchResults';
import type { Job, JobType, CommuteTime, CommuteMode } from '../../types';

const mockJob: Job = {
  id: '1',
  title: 'Test Job',
  company: 'Test Company',
  location: 'Paris',
  type: 'CDI',
  postedAt: new Date().toISOString(),
  experience: 'mid',
  salary: {
    min: 40000,
    max: 60000
  },
  description: 'Test description',
  url: 'https://example.com',
  remote: false,
  skills: ['React', 'TypeScript'],
  jobType: 'CDI' as JobType,
  experienceLevel: 'mid',
  commuteTimes: [{
    mode: 'driving' as CommuteMode,
    duration: 30,
    distance: 10
  }] as CommuteTime[],
  source: 'linkedin'
};

const mockJobs: Job[] = [
  {
    ...mockJob,
    id: '2',
    title: 'Another Job',
    jobType: 'CDI' as JobType,
    commuteTimes: [{
      mode: 'driving' as CommuteMode,
      duration: 45,
      distance: 15
    }] as CommuteTime[]
  }
];

describe('JobSearchResults', () => {
  const mockOnSaveJob = jest.fn();
  const mockOnPageChange = jest.fn();

  it('should render loading state', () => {
    render(
      <JobSearchResults
        jobs={[]}
        isLoading={true}
        error={null}
        onSaveJob={mockOnSaveJob}
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />
    );
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    render(
      <JobSearchResults
        jobs={[]}
        isLoading={false}
        error="Une erreur est survenue"
        onSaveJob={mockOnSaveJob}
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />
    );
    expect(screen.getByText('Erreur: Une erreur est survenue')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(
      <JobSearchResults
        jobs={[]}
        isLoading={false}
        error={null}
        onSaveJob={mockOnSaveJob}
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />
    );
    expect(screen.getByText('Aucun résultat trouvé')).toBeInTheDocument();
  });

  it('should render jobs', () => {
    render(
      <JobSearchResults
        jobs={mockJobs}
        isLoading={false}
        error={null}
        onSaveJob={mockOnSaveJob}
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />
    );
    expect(screen.getByText('Test Job')).toBeInTheDocument();
    expect(screen.getByText('Another Job')).toBeInTheDocument();
  });

  it('should render pagination', () => {
    render(
      <JobSearchResults
        jobs={mockJobs}
        isLoading={false}
        error={null}
        onSaveJob={mockOnSaveJob}
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
}); 