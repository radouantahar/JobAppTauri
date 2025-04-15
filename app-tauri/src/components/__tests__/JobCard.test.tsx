/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { JobCard } from '../JobCard';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store';
import type { Job, ISODateString, ExperienceLevel, JobStatus, JobSource, Currency, CommuteMode, JobType, SalaryPeriod } from '../../types';

// Mock des icônes
vi.mock('@tabler/icons-react', () => ({
  IconHeart: () => <span data-testid="icon-heart">♡</span>,
  IconHeartFilled: () => <span data-testid="icon-heart-filled">♥</span>,
  IconShare: () => <span data-testid="icon-share">↗</span>,
  IconMapPin: () => <span data-testid="icon-map-pin">📍</span>
}));

// Mock des hooks
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../store', () => ({
  useAppStore: vi.fn()
}));

// Mock des données de test
const mockJob: Job = {
  id: '1',
  title: 'Software Engineer',
  company: 'Tech Corp',
  location: 'Paris',
  description: 'Looking for a skilled software engineer',
  url: 'https://example.com/job/1',
  source: 'linkedin' as JobSource,
  publishedAt: '2024-03-20T00:00:00.000Z' as ISODateString,
  jobType: 'full-time' as JobType,
  experienceLevel: 'mid' as ExperienceLevel,
  salary: {
    min: 50000,
    max: 70000,
    currency: 'EUR' as Currency,
    period: 'year' as SalaryPeriod
  },
  matchingScore: 0.85,
  skills: ['JavaScript', 'React', 'TypeScript'],
  commuteTimes: {
    'home': {
      duration: 30,
      distance: 10,
      mode: 'driving' as CommuteMode
    }
  }
};

describe('JobCard', () => {
  const mockOnClick = vi.fn();
  const mockOnFavoriteClick = vi.fn();
  const mockOnShareClick = vi.fn();
  const mockAddFavorite = vi.fn();
  const mockRemoveFavorite = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ isAuthenticated: true });
    (useAppStore as any).mockReturnValue({
      addFavorite: mockAddFavorite,
      removeFavorite: mockRemoveFavorite,
      favorites: []
    });
  });

  test('renders job information correctly', () => {
    render(<JobCard job={mockJob} onClick={() => {}} />);
    
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<JobCard job={mockJob} onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Software Engineer'));
    expect(handleClick).toHaveBeenCalledWith(mockJob);
  });

  test('displays matching score when provided', () => {
    render(<JobCard job={mockJob} onClick={() => {}} />);
    
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  test('shows salary information when available', () => {
    render(<JobCard job={mockJob} onClick={() => {}} />);
    
    expect(screen.getByText('50 000 - 70 000 EUR/year')).toBeInTheDocument();
  });

  test('gère le clic sur le bouton favori', () => {
    render(
      <JobCard 
        job={mockJob}
        onClick={mockOnClick}
        onFavoriteClick={mockOnFavoriteClick}
        onShareClick={mockOnShareClick}
      />
    );

    const favoriteButton = screen.getByRole('button', { name: /ajouter aux favoris/i });
    fireEvent.click(favoriteButton);

    expect(mockAddFavorite).toHaveBeenCalledWith(mockJob);
    expect(mockOnFavoriteClick).toHaveBeenCalledWith(mockJob);
  });

  test('gère le clic sur le bouton partager', () => {
    render(
      <JobCard 
        job={mockJob}
        onClick={mockOnClick}
        onFavoriteClick={mockOnFavoriteClick}
        onShareClick={mockOnShareClick}
      />
    );

    const shareButton = screen.getByRole('button', { name: /partager/i });
    fireEvent.click(shareButton);

    expect(mockOnShareClick).toHaveBeenCalledWith(mockJob);
  });

  test('désactive le bouton favori si non authentifié', () => {
    (useAuth as any).mockReturnValue({ isAuthenticated: false });

    render(
      <JobCard 
        job={mockJob}
        onClick={mockOnClick}
        onFavoriteClick={mockOnFavoriteClick}
        onShareClick={mockOnShareClick}
      />
    );

    const favoriteButton = screen.getByRole('button', { name: /ajouter aux favoris/i });
    fireEvent.click(favoriteButton);

    expect(mockAddFavorite).not.toHaveBeenCalled();
    expect(mockOnFavoriteClick).not.toHaveBeenCalled();
  });

  test('devrait afficher le score de correspondance', () => {
    render(
      <JobCard
        job={mockJob}
        onClick={mockOnClick}
        onFavoriteClick={mockOnFavoriteClick}
        onShareClick={mockOnShareClick}
      />
    );

    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  test('devrait afficher un score faible', () => {
    const lowScoreJob = {
      ...mockJob,
      matchingScore: 0.3
    };

    render(
      <JobCard
        job={lowScoreJob}
        onClick={mockOnClick}
        onFavoriteClick={mockOnFavoriteClick}
        onShareClick={mockOnShareClick}
      />
    );

    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  test('devrait afficher le statut de l\'offre', () => {
    const jobWithStatus = {
      ...mockJob,
      status: 'applied' as JobStatus
    };

    render(
      <JobCard
        job={jobWithStatus}
        onClick={mockOnClick}
        onFavoriteClick={mockOnFavoriteClick}
        onShareClick={mockOnShareClick}
      />
    );
    
    expect(screen.getByText('Postulé')).toBeInTheDocument();
  });

  test('devrait gérer les offres sans localisation', () => {
    const jobWithoutLocation = {
      ...mockJob,
      location: ''
    };

    render(
      <JobCard
        job={jobWithoutLocation}
        onClick={mockOnClick}
        onFavoriteClick={mockOnFavoriteClick}
        onShareClick={mockOnShareClick}
      />
    );

    expect(screen.getByText('Lieu non spécifié')).toBeInTheDocument();
  });

  test('devrait afficher les avantages du poste', () => {
    render(
      <JobCard
        job={mockJob}
        onClick={mockOnClick}
        onFavoriteClick={mockOnFavoriteClick}
        onShareClick={mockOnShareClick}
      />
    );

    mockJob.skills?.forEach(skill => {
      expect(screen.getByText(skill)).toBeInTheDocument();
    });
  });

  test('devrait afficher les compétences requises', () => {
    render(
      <JobCard
        job={mockJob}
        onClick={mockOnClick}
        onFavoriteClick={mockOnFavoriteClick}
        onShareClick={mockOnShareClick}
      />
    );

    mockJob.skills?.forEach(skill => {
      expect(screen.getByText(skill)).toBeInTheDocument();
    });
  });

  test('devrait afficher le type de contrat', () => {
    render(
      <JobCard
        job={mockJob}
        onClick={mockOnClick}
        onFavoriteClick={mockOnFavoriteClick}
        onShareClick={mockOnShareClick}
      />
    );

    expect(screen.getByText('CDI')).toBeInTheDocument();
  });

  test('devrait afficher le niveau d\'expérience', () => {
    render(
      <JobCard
        job={mockJob}
        onClick={mockOnClick}
        onFavoriteClick={mockOnFavoriteClick}
        onShareClick={mockOnShareClick}
      />
    );

    expect(screen.getByText('Niveau intermédiaire')).toBeInTheDocument();
  });

  test('devrait afficher le temps de trajet', () => {
    render(
      <JobCard
        job={mockJob}
        onClick={mockOnClick}
        onFavoriteClick={mockOnFavoriteClick}
        onShareClick={mockOnShareClick}
      />
    );

    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  test('devrait gérer les offres sans temps de trajet', () => {
    const jobWithoutCommute = {
      ...mockJob,
      commuteTimes: {
        primaryHome: {
          duration: 0,
          distance: 0,
          mode: "driving" as CommuteMode
        }
      }
    };

    render(
      <JobCard
        job={jobWithoutCommute}
        onClick={mockOnClick}
        onFavoriteClick={mockOnFavoriteClick}
        onShareClick={mockOnShareClick}
      />
    );

    expect(screen.getByText('Temps de trajet non calculé')).toBeInTheDocument();
  });
});