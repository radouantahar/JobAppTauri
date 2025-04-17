/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navigation from '../Navigation';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// Mock des hooks
vi.mock('../../hooks/useAuth');
vi.mock('react-router-dom');

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockUseNavigate = useNavigate as ReturnType<typeof vi.fn>;

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    mockUseNavigate.mockReturnValue(vi.fn());
  });

  test('should render navigation links when not authenticated', () => {
    render(<Navigation isAuthenticated={false} />);
    
    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Recherche')).toBeInTheDocument();
    expect(screen.getByText('Connexion')).toBeInTheDocument();
    expect(screen.getByText('Inscription')).toBeInTheDocument();
    expect(screen.queryByText('Déconnexion')).not.toBeInTheDocument();
  });

  test('should render navigation links when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    render(<Navigation isAuthenticated={true} />);
    
    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Recherche')).toBeInTheDocument();
    expect(screen.getByText('Tableau Kanban')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Statistiques')).toBeInTheDocument();
    expect(screen.getByText('Déconnexion')).toBeInTheDocument();
    expect(screen.queryByText('Connexion')).not.toBeInTheDocument();
    expect(screen.queryByText('Inscription')).not.toBeInTheDocument();
  });

  test('should handle logout when clicking logout button', () => {
    const mockNavigate = vi.fn();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseAuth.mockReturnValue({ 
      isAuthenticated: true,
      logout: vi.fn()
    });

    render(<Navigation isAuthenticated={true} />);
    const logoutButton = screen.getByText('Déconnexion');
    logoutButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('should navigate to correct routes when clicking links', () => {
    const mockNavigate = vi.fn();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseAuth.mockReturnValue({ isAuthenticated: true });

    render(<Navigation isAuthenticated={true} />);
    
    screen.getByText('Accueil').click();
    expect(mockNavigate).toHaveBeenCalledWith('/');

    screen.getByText('Recherche').click();
    expect(mockNavigate).toHaveBeenCalledWith('/search');

    screen.getByText('Tableau Kanban').click();
    expect(mockNavigate).toHaveBeenCalledWith('/kanban');

    screen.getByText('Documents').click();
    expect(mockNavigate).toHaveBeenCalledWith('/documents');

    screen.getByText('Statistiques').click();
    expect(mockNavigate).toHaveBeenCalledWith('/statistics');
  });
}); 