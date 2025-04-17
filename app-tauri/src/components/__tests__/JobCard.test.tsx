/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JobCard } from '../JobCard';
import { createMockJob } from './fixtures/job';

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
});