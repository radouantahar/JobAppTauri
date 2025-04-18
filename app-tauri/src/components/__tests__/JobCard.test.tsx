/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JobCard } from '../JobCard';
import { createMockJob } from './fixtures/job';
import type { CommuteMode } from '../../types/job';

describe('JobCard', () => {
  const mockJob = createMockJob();

  it('renders job details correctly', () => {
    render(<JobCard job={mockJob} />);
    
    expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    expect(screen.getByText(mockJob.company)).toBeInTheDocument();
    expect(screen.getByText(mockJob.location)).toBeInTheDocument();
    expect(screen.getByText(mockJob.type)).toBeInTheDocument();
  });

  it('renders salary range when available', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('40 000 € - 60 000 € / an')).toBeInTheDocument();
  });

  it('renders skills when available', () => {
    render(<JobCard job={mockJob} />);
    if (mockJob.skills && mockJob.skills.length > 0) {
      mockJob.skills.forEach(skill => {
        expect(screen.getByText(skill)).toBeInTheDocument();
      });
    }
  });

  it('calls onRemoveFavorite when favorite button is clicked', () => {
    const onRemoveFavorite = vi.fn();
    render(<JobCard job={mockJob} isFavorite onRemoveFavorite={onRemoveFavorite} />);
    
    const favoriteButton = screen.getByTitle('Retirer des favoris');
    fireEvent.click(favoriteButton);
    
    expect(onRemoveFavorite).toHaveBeenCalled();
  });

  it('calls onClick when card is clicked', () => {
    const onClick = vi.fn();
    render(<JobCard job={mockJob} onClick={onClick} />);
    
    const card = screen.getByRole('article');
    fireEvent.click(card);
    
    expect(onClick).toHaveBeenCalledWith(mockJob);
  });

  it('does not show favorite button when isFavorite is false', () => {
    render(<JobCard job={mockJob} isFavorite={false} />);
    
    const favoriteButton = screen.queryByTitle('Retirer des favoris');
    expect(favoriteButton).not.toBeInTheDocument();
  });

  it('renders remote badge when job is remote', () => {
    const remoteJob = { ...mockJob, remote: true };
    render(<JobCard job={remoteJob} />);
    
    expect(screen.getByText('Remote')).toBeInTheDocument();
  });

  it('renders matching score when available', () => {
    const jobWithScore = { ...mockJob, matchingScore: 85 };
    render(<JobCard job={jobWithScore} />);
    
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders commute times when available', () => {
    const jobWithCommute = {
      ...mockJob,
      commuteTimes: [
        { mode: 'driving' as CommuteMode, duration: 30, distance: 10 },
        { mode: 'transit' as CommuteMode, duration: 45, distance: 15 }
      ]
    };
    render(<JobCard job={jobWithCommute} />);
    
    expect(screen.getByText('30 min (voiture)')).toBeInTheDocument();
    expect(screen.getByText('45 min (transport)')).toBeInTheDocument();
  });
});