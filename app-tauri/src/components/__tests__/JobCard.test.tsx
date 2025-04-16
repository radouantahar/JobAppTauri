/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import { JobCard } from '../JobCard';
import type { Job, JobType, CommuteTime, CommuteMode } from '../../types';
import { createMockJob } from '../../__tests__/helpers';

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

describe('JobCard', () => {
  const mockOnClick = vi.fn();
  const mockOnShareClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders job information correctly', () => {
    render(<JobCard job={mockJob} />);
    
    expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    expect(screen.getByText(mockJob.company)).toBeInTheDocument();
    expect(screen.getByText(mockJob.location)).toBeInTheDocument();
    expect(screen.getByText(mockJob.description)).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const job = createMockJob();
    render(
      <JobCard
        job={job}
        onClick={mockOnClick}
        onShareClick={mockOnShareClick}
      />
    );

    fireEvent.click(screen.getByRole('article'));
    expect(mockOnClick).toHaveBeenCalledWith(job);
  });

  it('calls onShareClick when share button is clicked', () => {
    const job = createMockJob();
    render(
      <JobCard
        job={job}
        onClick={mockOnClick}
        onShareClick={mockOnShareClick}
      />
    );

    fireEvent.click(screen.getByLabelText('share'));
    expect(mockOnShareClick).toHaveBeenCalledWith(job);
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