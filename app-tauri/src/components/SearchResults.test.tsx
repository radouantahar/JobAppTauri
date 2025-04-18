import { render, screen, fireEvent } from '@testing-library/react';
import { SearchResults } from './SearchResults';
import { Job, JobType, ExperienceLevel, JobSource } from '../types/job';
import { createISODateString } from '../types/core';
import { createMockJob } from '../__tests__/helpers';

const mockJobs: Job[] = [
  createMockJob({
    id: '1',
    title: 'Développeur Full Stack',
    company: 'Tech Corp',
    location: 'Paris',
    type: 'CDI' as JobType,
    postedAt: createISODateString(new Date().toISOString()),
    experienceLevel: 'mid' as ExperienceLevel,
    salary: {
      min: 40000,
      max: 60000,
      currency: 'EUR',
      period: 'year'
    },
    description: 'Description du poste',
    url: 'https://example.com/job/1',
    remote: false,
    skills: ['React', 'TypeScript'],
    jobType: 'CDI' as JobType,
    commuteTimes: [],
    source: 'linkedin' as JobSource
  }),
  createMockJob({
    id: '2',
    title: 'Ingénieur DevOps',
    company: 'Cloud Inc',
    location: 'Lyon',
    type: 'CDI' as JobType,
    postedAt: createISODateString(new Date().toISOString()),
    experienceLevel: 'senior' as ExperienceLevel,
    salary: {
      min: 50000,
      max: 70000,
      currency: 'EUR',
      period: 'year'
    },
    description: 'Description du poste',
    url: 'https://example.com/job/2',
    remote: true,
    skills: ['Docker', 'Kubernetes'],
    jobType: 'CDI' as JobType,
    commuteTimes: [],
    source: 'linkedin' as JobSource
  })
];

describe('SearchResults', () => {
  it('renders job cards correctly', () => {
    render(
      <SearchResults 
        jobs={mockJobs} 
        onJobClick={() => {}} 
        loading={false}
        error={null}
      />
    );
    
    expect(screen.getByText('Développeur Frontend')).toBeInTheDocument();
    expect(screen.getByText('Développeur Backend')).toBeInTheDocument();
  });

  it('calls onJobClick when a job card is clicked', () => {
    const handleJobClick = vi.fn();
    render(
      <SearchResults 
        jobs={mockJobs} 
        onJobClick={handleJobClick} 
        loading={false}
        error={null}
      />
    );
    
    fireEvent.click(screen.getByText('Développeur Frontend'));
    expect(handleJobClick).toHaveBeenCalledWith(mockJobs[0]);
  });

  it('displays matching score when provided', () => {
    render(
      <SearchResults 
        jobs={mockJobs} 
        onJobClick={() => {}} 
        loading={false}
        error={null}
      />
    );
    
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('shows salary information when available', () => {
    render(
      <SearchResults 
        jobs={mockJobs} 
        onJobClick={() => {}} 
        loading={false}
        error={null}
      />
    );
    
    expect(screen.getByText('45 000 - 65 000 EUR/year')).toBeInTheDocument();
  });

  it('devrait afficher une liste de jobs', () => {
    render(
      <SearchResults 
        jobs={mockJobs} 
        onJobClick={() => {}} 
        loading={false}
        error={null}
      />
    );
    // ... existing code ...
  });

  it('devrait appeler onJobClick quand un job est cliqué', () => {
    const handleJobClick = vi.fn();
    render(
      <SearchResults 
        jobs={mockJobs} 
        onJobClick={handleJobClick} 
        loading={false}
        error={null}
      />
    );
    // ... existing code ...
  });

  it('devrait afficher un message quand il n\'y a pas de jobs', () => {
    render(
      <SearchResults 
        jobs={[]} 
        onJobClick={() => {}} 
        loading={false}
        error={null}
      />
    );
    // ... existing code ...
  });

  it('devrait afficher un message d\'erreur', () => {
    render(
      <SearchResults 
        jobs={mockJobs} 
        onJobClick={() => {}} 
        loading={false}
        error="Erreur de chargement"
      />
    );
    // ... existing code ...
  });
}); 