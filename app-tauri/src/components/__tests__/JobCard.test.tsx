/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import { JobCard } from '../JobCard';
import type { Job, ISODateString } from '../../types';

const mockJob: Job = {
  id: '1',
  title: 'Software Engineer',
  company: 'Test Company',
  location: 'Remote',
  description: 'Test description',
  url: 'https://example.com/job/1',
  source: 'linkedin',
  publishedAt: '2024-04-15T12:00:00Z' as ISODateString,
  jobType: 'full-time',
  experienceLevel: 'mid',
  salary: {
    min: 50000,
    max: 100000,
    currency: 'EUR',
    period: 'year'
  },
  matchingScore: 0.85,
  skills: ['React', 'TypeScript'],
  commuteTimes: {
    primaryHome: {
      duration: 30,
      distance: 5,
      mode: 'transit'
    }
  }
};

describe('JobCard', () => {
  const mockOnClick = vi.fn();
  const mockOnShareClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders job information correctly', () => {
    render(
      <JobCard
        job={mockJob}
        onClick={mockOnClick}
        onShareClick={mockOnShareClick}
      />
    );

    expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    expect(screen.getByText(`${mockJob.company} • ${mockJob.location}`)).toBeInTheDocument();
    expect(screen.getByText(mockJob.jobType)).toBeInTheDocument();
    expect(screen.getByText(mockJob.experienceLevel)).toBeInTheDocument();
    expect(screen.getByText(mockJob.description)).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(
      <JobCard
        job={mockJob}
        onClick={mockOnClick}
        onShareClick={mockOnShareClick}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledWith(mockJob);
  });

  it('calls onShareClick when share button is clicked', () => {
    render(
      <JobCard
        job={mockJob}
        onClick={mockOnClick}
        onShareClick={mockOnShareClick}
      />
    );

    const shareButton = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareButton);
    expect(mockOnShareClick).toHaveBeenCalledWith(mockJob);
  });

  it('displays salary information when available', () => {
    render(
      <JobCard
        job={mockJob}
        onClick={mockOnClick}
        onShareClick={mockOnShareClick}
      />
    );

    const salaryText = `${mockJob.salary.min.toLocaleString()} - ${mockJob.salary.max.toLocaleString()} ${mockJob.salary.currency}/${mockJob.salary.period}`;
    expect(screen.getByText(salaryText)).toBeInTheDocument();
  });
});