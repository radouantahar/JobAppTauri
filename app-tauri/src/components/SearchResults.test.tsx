import { render, screen, fireEvent } from '@testing-library/react';
import { SearchResults } from './SearchResults';
import { Job, JobType, ExperienceLevel, ISODateString } from '../types';

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Développeur React',
    company: 'TechCorp',
    location: 'Paris',
    description: 'Description du poste',
    url: 'https://example.com/job',
    source: 'linkedin',
    publishedAt: new Date().toISOString() as ISODateString,
    jobType: 'full-time' as JobType,
    experienceLevel: 'senior' as ExperienceLevel,
    salary: {
      min: 45000,
      max: 55000,
      currency: 'EUR',
      period: 'year'
    },
    matchingScore: 85,
    skills: ['React', 'TypeScript'],
    commuteTimes: {
      primaryHome: {
        duration: 30,
        distance: 5,
        mode: 'transit'
      }
    }
  },
  {
    id: '2',
    title: 'Développeur Frontend',
    company: 'WebDev',
    location: 'Lyon',
    description: 'Description du poste',
    url: 'https://example.com/job2',
    source: 'indeed',
    publishedAt: new Date().toISOString() as ISODateString,
    jobType: 'full-time' as JobType,
    experienceLevel: 'senior' as ExperienceLevel,
    salary: {
      min: 40000,
      max: 50000,
      currency: 'EUR',
      period: 'year'
    },
    matchingScore: 75,
    skills: ['React', 'JavaScript'],
    commuteTimes: {
      primaryHome: {
        duration: 25,
        distance: 4,
        mode: 'transit'
      }
    }
  }
];

describe('SearchResults', () => {
  it('renders job cards correctly', () => {
    render(<SearchResults jobs={mockJobs} onJobClick={() => {}} />);
    
    expect(screen.getByText('Développeur React')).toBeInTheDocument();
    expect(screen.getByText('Développeur Frontend')).toBeInTheDocument();
  });

  it('calls onJobClick when a job card is clicked', () => {
    const handleJobClick = jest.fn();
    render(<SearchResults jobs={mockJobs} onJobClick={handleJobClick} />);
    
    fireEvent.click(screen.getByText('Développeur React'));
    expect(handleJobClick).toHaveBeenCalledWith(mockJobs[0]);
  });

  it('displays matching score when provided', () => {
    render(<SearchResults jobs={mockJobs} onJobClick={() => {}} />);
    
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows salary information when available', () => {
    render(<SearchResults jobs={mockJobs} onJobClick={() => {}} />);
    
    expect(screen.getByText('45 000 - 55 000 EUR/year')).toBeInTheDocument();
  });

  it('devrait afficher une liste de jobs', () => {
    render(<SearchResults jobs={mockJobs} onJobClick={() => {}} />);
    // ... existing code ...
  });

  it('devrait appeler onJobClick quand un job est cliqué', () => {
    const handleJobClick = vi.fn();
    render(<SearchResults jobs={mockJobs} onJobClick={handleJobClick} />);
    // ... existing code ...
  });

  it('devrait afficher un message quand il n\'y a pas de jobs', () => {
    render(<SearchResults jobs={[]} onJobClick={() => {}} />);
    // ... existing code ...
  });

  it('devrait afficher un message d\'erreur', () => {
    render(<SearchResults jobs={mockJobs} onJobClick={() => {}} error="Erreur de chargement" />);
    // ... existing code ...
  });
}); 