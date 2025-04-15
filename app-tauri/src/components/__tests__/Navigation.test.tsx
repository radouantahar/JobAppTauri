import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import Navigation from '../Navigation';
import { useAppStore } from '../../store';

// Mock des hooks et composants
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(),
  };
});

vi.mock('../../store', () => ({
  useAppStore: vi.fn(),
}));

describe('Navigation', () => {
  const mockSetIsAuthenticated = vi.fn();
  const mockLocation = { pathname: '/' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useLocation as any).mockReturnValue(mockLocation);
    (useAppStore as any).mockReturnValue({
      setIsAuthenticated: mockSetIsAuthenticated,
    });
  });

  test('affiche tous les liens de navigation pour un utilisateur non authentifié', () => {
    render(
      <MemoryRouter>
        <Navigation isAuthenticated={false} />
      </MemoryRouter>
    );

    // Vérifie que les liens publics sont affichés
    expect(screen.getByLabelText('Accueil')).toBeInTheDocument();
    expect(screen.getByLabelText('Offres')).toBeInTheDocument();
    expect(screen.getByLabelText('Kanban')).toBeInTheDocument();
    expect(screen.getByLabelText('Trajets')).toBeInTheDocument();
    expect(screen.getByLabelText('Statistiques')).toBeInTheDocument();

    // Vérifie que les liens privés ne sont pas affichés
    expect(screen.queryByLabelText('Documents')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Profil')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Paramètres')).not.toBeInTheDocument();
  });

  test('affiche tous les liens de navigation pour un utilisateur authentifié', () => {
    render(
      <MemoryRouter>
        <Navigation isAuthenticated={true} />
      </MemoryRouter>
    );

    // Vérifie que tous les liens sont affichés
    expect(screen.getByLabelText('Accueil')).toBeInTheDocument();
    expect(screen.getByLabelText('Offres')).toBeInTheDocument();
    expect(screen.getByLabelText('Kanban')).toBeInTheDocument();
    expect(screen.getByLabelText('Documents')).toBeInTheDocument();
    expect(screen.getByLabelText('Trajets')).toBeInTheDocument();
    expect(screen.getByLabelText('Profil')).toBeInTheDocument();
    expect(screen.getByLabelText('Paramètres')).toBeInTheDocument();
    expect(screen.getByLabelText('Statistiques')).toBeInTheDocument();
    expect(screen.getByLabelText('Déconnexion')).toBeInTheDocument();
  });

  test('met en surbrillance le lien actif', () => {
    (useLocation as any).mockReturnValue({ pathname: '/jobs' });

    render(
      <MemoryRouter>
        <Navigation isAuthenticated={true} />
      </MemoryRouter>
    );

    const activeLink = screen.getByLabelText('Offres');
    expect(activeLink).toHaveClass('active');
  });

  test('gère la déconnexion avec succès', async () => {
    render(
      <MemoryRouter>
        <Navigation isAuthenticated={true} />
      </MemoryRouter>
    );

    const logoutButton = screen.getByLabelText('Déconnexion');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockSetIsAuthenticated).toHaveBeenCalledWith(false);
    });
  });

  test('affiche une notification d\'erreur en cas d\'échec de la déconnexion', async () => {
    (useAppStore as any).mockReturnValue({
      setIsAuthenticated: () => {
        throw new Error('Erreur de déconnexion');
      },
    });

    render(
      <MemoryRouter>
        <Navigation isAuthenticated={true} />
      </MemoryRouter>
    );

    const logoutButton = screen.getByLabelText('Déconnexion');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByText('Erreur lors de la déconnexion')).toBeInTheDocument();
    });
  });

  test('ferme la notification d\'erreur', async () => {
    (useAppStore as any).mockReturnValue({
      setIsAuthenticated: () => {
        throw new Error('Erreur de déconnexion');
      },
    });

    render(
      <MemoryRouter>
        <Navigation isAuthenticated={true} />
      </MemoryRouter>
    );

    const logoutButton = screen.getByLabelText('Déconnexion');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByText('Erreur lors de la déconnexion')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Erreur lors de la déconnexion')).not.toBeInTheDocument();
    });
  });
}); 