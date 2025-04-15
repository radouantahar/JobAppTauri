/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { JobCard } from '../JobCard';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store';
import type { Job, JobID, ISODateString, ExperienceLevel, JobStatus, JobSource, Currency, CommuteMode } from '../../types';

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
  id: 1 as JobID,
  title: "Développeur Full Stack",
  company: "Tech Company",
  location: "Paris, France",
  description: "Description du poste",
  url: "https://example.com/job",
  source: "linkedin" as JobSource,
  publishedAt: "2024-03-20T10:00:00Z" as ISODateString,
  salary: {
    min: 45000,
    max: 65000,
    currency: "EUR" as Currency
  },
  matchingScore: 0.85,
  commuteTimes: {
    primaryHome: {
      duration: 30,
      distance: 10.5,
      mode: "driving" as CommuteMode
    }
  },
  experienceLevel: "mid-level" as ExperienceLevel,
  status: "active" as JobStatus,
  skills: ["React", "TypeScript", "Node.js"]
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

  test('affiche les informations du job correctement', () => {
    render(
      <JobCard 
        job={mockJob}
        onClick={mockOnClick}
        onFavoriteClick={mockOnFavoriteClick}
        onShareClick={mockOnShareClick}
      />
    );

    expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    expect(screen.getByText(mockJob.company)).toBeInTheDocument();
    expect(screen.getByText(mockJob.location)).toBeInTheDocument();
    expect(screen.getByText("45000 - 65000 €")).toBeInTheDocument();
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