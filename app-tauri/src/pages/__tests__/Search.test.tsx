import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchPage } from '../Search';
import { useAppStore } from '../../store';
import { jobService } from '../../services/api';
import { MemoryRouter } from 'react-router-dom';
import type { Job, JobID, ISODateString, AppState } from '../../types';

jest.mock('../../store');

const mockAppState: AppState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  setUser: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
  searchQuery: '',
  filters: {
    location: '',
    jobType: [],
    experienceLevel: [],
    salaryRange: {
      min: 0,
      max: 100000
    }
  },
  isLoading: false,
  setSearchQuery: jest.fn(),
  setFilters: jest.fn()
};

// Mock des dépendances
vi.mock('../../store', () => ({
  useAppStore: vi.fn()
}));

vi.mock('../../services/api', () => ({
  jobService: {
    searchJobs: vi.fn()
  }
}));

describe('SearchPage', () => {
  beforeEach(() => {
    vi.mocked(useAppStore).mockReturnValue(mockAppState);
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

  it('should display search results when jobs are found', async () => {
    const mockJobs: Job[] = [
      {
        id: '1' as JobID,
        title: 'Développeur React',
        company: 'Tech Corp',
        description: 'Description du poste',
        location: 'Paris',
        url: 'https://example.com/job/1',
        source: 'linkedin',
        publishedAt: new Date().toISOString() as ISODateString,
        jobType: 'full-time',
        salary: {
          min: 40000,
          max: 50000,
          currency: 'EUR',
          period: 'year'
        },
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
      }
    ];

    vi.mocked(jobService.searchJobs).mockResolvedValue(mockJobs);

    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Rechercher un emploi...');
    fireEvent.change(searchInput, { target: { value: 'react' } });

    await waitFor(() => {
      expect(screen.getByText('Développeur React')).toBeInTheDocument();
    });
  });

  it('should display no results message when no jobs are found', async () => {
    vi.mocked(jobService.searchJobs).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Rechercher un emploi...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('Aucun résultat trouvé')).toBeInTheDocument();
    });
  });
}); 