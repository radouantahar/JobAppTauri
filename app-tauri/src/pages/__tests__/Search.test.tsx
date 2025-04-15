import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SearchPage } from '../Search';
import { useAppStore } from '../../store';
import { jobService } from '../../services/api';
import { MemoryRouter } from 'react-router-dom';
import type { Job, JobID, ISODateString, SalaryRange, JobSource, AppState } from '../../types';

// Mock des dépendances
vi.mock('../../store', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  jobService: {
    searchJobs: vi.fn(),
  },
}));

// Données de test
const mockJobs: Job[] = [
  {
    id: 1 as JobID,
    title: 'Développeur React',
    company: 'TechCorp',
    location: 'Paris',
    description: 'Description du poste',
    url: 'https://example.com/job1',
    source: 'linkedin' as JobSource,
    publishedAt: new Date().toISOString() as ISODateString,
    salary: {
      min: 45000,
      max: 55000,
      currency: 'EUR',
      period: 'year'
    } as SalaryRange,
    matchingScore: 0.85,
    skills: ['React', 'TypeScript'],
    experienceLevel: 'mid',
    commuteTimes: {
      primaryHome: {
        duration: 30,
        distance: 5,
        mode: 'transit'
      }
    }
  },
  // ... autres jobs
];

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      setLoading: vi.fn(),
      isAuthenticated: false,
    } as Partial<AppState>);
    (jobService.searchJobs as ReturnType<typeof vi.fn>).mockResolvedValue(mockJobs);
  });

  // Test du cas normal
  it('devrait afficher les offres d\'emploi correctement', async () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    // Vérification du chargement initial
    await waitFor(() => {
      expect(jobService.searchJobs).toHaveBeenCalled();
    });

    // Vérification de l'affichage des offres
    expect(screen.getByText('Développeur React')).toBeInTheDocument();
    expect(screen.getByText('TechCorp')).toBeInTheDocument();
  });

  // Test de la recherche
  it('devrait mettre à jour les résultats lors d\'une recherche', async () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Rechercher des offres...');
    fireEvent.change(searchInput, { target: { value: 'React' } });

    // Attente du debounce
    await waitFor(() => {
      expect(jobService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          keywords: ['React'],
        })
      );
    }, { timeout: 1000 });
  });

  // Test du cas d'erreur
  it('devrait afficher une erreur en cas d\'échec de la recherche', async () => {
    (jobService.searchJobs as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Erreur API'));

    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Erreur lors de la recherche')).toBeInTheDocument();
    });

    // Test du bouton de réessai
    const retryButton = screen.getByText('Réessayer');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(jobService.searchJobs).toHaveBeenCalledTimes(2);
    });
  });

  // Test du cas limite : aucun résultat
  it('devrait gérer le cas où aucune offre n\'est trouvée', async () => {
    (jobService.searchJobs as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('0 offres trouvées')).toBeInTheDocument();
    });
  });

  // Test de la pagination infinie
  it('devrait charger plus d\'offres lors du scroll', async () => {
    const { container } = render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    // Simulation de l'intersection observer
    const loadMoreTrigger = container.querySelector('[data-testid="load-more-trigger"]');
    if (loadMoreTrigger) {
      const mockIntersectionObserverEntry = {
        isIntersecting: true,
        target: loadMoreTrigger,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRatio: 1,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: 0
      };

      const observer = new IntersectionObserver((entries) => {
        entries[0].target.dispatchEvent(new CustomEvent('scroll'));
      });
      observer.observe(loadMoreTrigger);
      
      // Simuler l'intersection
      observer.takeRecords = () => [mockIntersectionObserverEntry];
      observer.disconnect();
    }

    await waitFor(() => {
      expect(jobService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  // Test de redirection si non authentifié
  it('devrait rediriger vers la page de login si non authentifié', async () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const jobCard = screen.getByText('Développeur React');
      fireEvent.click(jobCard);
      expect(window.location.pathname).toBe('/login');
    });
  });
}); 