import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchPage } from '../Search';
import type { Job, ISODateString, AppState, JobType, ExperienceLevel } from '../../types';
import { useAppStore } from '../../store';
import { jobService } from '../../services/api';
import { MemoryRouter } from 'react-router-dom';

// Mock des dépendances
vi.mock('../../store', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  jobService: {
    searchJobs: vi.fn(),
  },
}));

// Données de test pour les tests de performance
const generateMockJobs = (count: number): Job[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    title: `Job ${i + 1}`,
    company: `Company ${i + 1}`,
    location: 'Paris',
    description: 'Description',
    url: 'https://example.com',
    source: 'linkedin',
    publishedAt: new Date().toISOString() as ISODateString,
    jobType: 'full-time' as JobType,
    experienceLevel: 'mid' as ExperienceLevel,
    skills: ['React', 'TypeScript'],
    salary: {
      min: 40000,
      max: 60000,
      currency: 'EUR',
      period: 'year'
    },
    matchingScore: 0.85,
    commuteTimes: {
      'home': {
        duration: 30,
        distance: 10,
        mode: 'driving'
      }
    }
  }));
};

describe('SearchPage - Tests de Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      setLoading: vi.fn(),
      isAuthenticated: false,
    } as Partial<AppState>);
  });

  // Test de performance du rendu initial
  it('devrait rendre rapidement avec 100 offres', async () => {
    const mockJobs = generateMockJobs(100);
    (jobService.searchJobs as ReturnType<typeof vi.fn>).mockResolvedValue(mockJobs);

    const startTime = performance.now();
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );
    const endTime = performance.now();

    // Vérification du temps de rendu
    expect(endTime - startTime).toBeLessThan(1000); // Moins d'une seconde

    // Vérification de l'affichage
    await waitFor(() => {
      expect(screen.getByText('Job 1')).toBeInTheDocument();
      expect(screen.getByText('Company 1')).toBeInTheDocument();
    });
  });

  // Test de performance de la recherche
  it('devrait mettre à jour rapidement les résultats lors d\'une recherche', async () => {
    const mockJobs = generateMockJobs(50);
    (jobService.searchJobs as ReturnType<typeof vi.fn>).mockResolvedValue(mockJobs);

    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Rechercher des offres...');
    const startTime = performance.now();
    fireEvent.change(searchInput, { target: { value: 'React' } });
    const endTime = performance.now();

    // Vérification du temps de réponse
    expect(endTime - startTime).toBeLessThan(100); // Moins de 100ms

    await waitFor(() => {
      expect(jobService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          keywords: ['React'],
        })
      );
    });
  });

  // Test de performance du chargement infini
  it('devrait charger rapidement plus d\'offres lors du scroll', async () => {
    const initialJobs = generateMockJobs(10);
    const moreJobs = generateMockJobs(10);
    (jobService.searchJobs as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(initialJobs)
      .mockResolvedValueOnce(moreJobs);

    const { container } = render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    // Simulation de l'intersection observer
    const loadMoreTrigger = container.querySelector('[data-testid="load-more-trigger"]');
    if (loadMoreTrigger) {
      const startTime = performance.now();
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
      
      observer.takeRecords = () => [mockIntersectionObserverEntry];
      observer.disconnect();
      const endTime = performance.now();

      // Vérification du temps de réponse
      expect(endTime - startTime).toBeLessThan(100); // Moins de 100ms
    }

    await waitFor(() => {
      expect(jobService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  // Test de performance de la gestion des erreurs
  it('devrait gérer rapidement les erreurs', async () => {
    (jobService.searchJobs as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Erreur API'));

    const startTime = performance.now();
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );
    const endTime = performance.now();

    // Vérification du temps de rendu
    expect(endTime - startTime).toBeLessThan(1000); // Moins d'une seconde

    await waitFor(() => {
      expect(screen.getByText('Erreur lors de la recherche')).toBeInTheDocument();
    });
  });

  // Test de performance de la mémoire
  it('devrait maintenir une utilisation mémoire stable', async () => {
    const mockJobs = generateMockJobs(100);
    (jobService.searchJobs as ReturnType<typeof vi.fn>).mockResolvedValue(mockJobs);

    const initialMemory = process.memoryUsage().heapUsed;
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Job 1')).toBeInTheDocument();
    });

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Vérification de l'utilisation mémoire
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Moins de 10MB d'augmentation
  });

  it('should render 100 jobs in less than 500ms', () => {
    generateMockJobs(100);
    const startTime = performance.now();
    
    render(<SearchPage />);
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(500);
  });

  it('should handle search with 1000 jobs in less than 1000ms', () => {
    generateMockJobs(1000);
    const startTime = performance.now();
    
    render(<SearchPage />);
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(1000);
  });

  it('should maintain stable memory usage during multiple renders', () => {
    generateMockJobs(100);
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    const memorySamples: number[] = [];

    for (let i = 0; i < 10; i++) {
      render(<SearchPage />);
      if (performance.memory) {
        memorySamples.push(performance.memory.usedJSHeapSize);
      }
    }

    if (memorySamples.length > 0) {
      const maxMemoryIncrease = Math.max(...memorySamples) - initialMemory;
      expect(maxMemoryIncrease).toBeLessThan(5 * 1024 * 1024); // Moins de 5MB d'augmentation
    }
  });
}); 