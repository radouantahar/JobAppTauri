import { render, screen, fireEvent } from '@testing-library/react';
import { SearchResults } from './SearchResults';
import { Job } from '../types';
import { createMockJob } from '../__tests__/helpers';

const mockJobs: Job[] = [
  createMockJob({
    id: '1',
    title: 'Développeur Frontend',
    company: 'Tech Corp',
    location: 'Paris',
    type: 'CDI',
    experience: 'mid',
    postedAt: '2024-03-15',
    salary: {
      min: 45000,
      max: 65000,
      currency: 'EUR',
      period: 'year'
    },
    skills: ['React', 'TypeScript'],
    matchingScore: 0.85,
    remote: false,
    contractType: 'permanent',
    createdAt: '2024-03-15T10:00:00Z'
  }),
  createMockJob({
    id: '2',
    title: 'Développeur Backend',
    company: 'Data Systems',
    location: 'Lyon',
    type: 'CDI',
    experience: 'senior',
    postedAt: '2024-03-14',
    salary: {
      min: 55000,
      max: 75000,
      currency: 'EUR',
      period: 'year'
    },
    skills: ['Python', 'FastAPI'],
    matchingScore: 0.9,
    remote: false,
    contractType: 'permanent',
    createdAt: '2024-03-14T10:00:00Z'
  })
];

describe('SearchResults', () => {
  it('renders job cards correctly', () => {
    render(<SearchResults jobs={mockJobs} onJobClick={() => {}} />);
    
    expect(screen.getByText('Développeur Frontend')).toBeInTheDocument();
    expect(screen.getByText('Développeur Backend')).toBeInTheDocument();
  });

  it('calls onJobClick when a job card is clicked', () => {
    const handleJobClick = jest.fn();
    render(<SearchResults jobs={mockJobs} onJobClick={handleJobClick} />);
    
    fireEvent.click(screen.getByText('Développeur Frontend'));
    expect(handleJobClick).toHaveBeenCalledWith(mockJobs[0]);
  });

  it('displays matching score when provided', () => {
    render(<SearchResults jobs={mockJobs} onJobClick={() => {}} />);
    
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('shows salary information when available', () => {
    render(<SearchResults jobs={mockJobs} onJobClick={() => {}} />);
    
    expect(screen.getByText('45 000 - 65 000 EUR/year')).toBeInTheDocument();
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