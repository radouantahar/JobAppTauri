/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { DocumentForm } from '../DocumentForm';
import type { AuthContextType } from '@/contexts/AuthContext';
import type { Document } from '@/types';

// Mock du contexte d'authentification
const mockAuthContext: AuthContextType = {
  isAuthenticated: true,
  user: {
    id: '1',
    email: 'test@example.com'
  },
  token: 'mock-token',
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn()
};

// Wrapper pour fournir le contexte d'authentification
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
};

// Props par défaut pour DocumentForm
const defaultProps = {
  opened: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  initialValues: {
    name: '',
    type: 'cv',
    description: '',
    content: '',
    size: 0,
    url: '',
    filePath: ''
  } as Partial<Document>
};

describe('DocumentForm Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form quickly', async () => {
    const startTime = performance.now();
    
    render(
      <AuthWrapper>
        <DocumentForm {...defaultProps} />
      </AuthWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Vérifier que le rendu prend moins de 100ms
    expect(renderTime).toBeLessThan(100);

    // Vérifier que les éléments sont présents
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('should handle form submission efficiently', async () => {
    render(
      <AuthWrapper>
        <DocumentForm {...defaultProps} />
      </AuthWrapper>
    );

    const startTime = performance.now();

    // Simuler la saisie du formulaire
    fireEvent.change(screen.getByLabelText(/nom/i), {
      target: { value: 'Test Document' }
    });
    fireEvent.change(screen.getByLabelText(/type/i), {
      target: { value: 'cv' }
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test description' }
    });

    // Simuler la soumission
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    const endTime = performance.now();
    const submissionTime = endTime - startTime;

    // Vérifier que la soumission prend moins de 200ms
    expect(submissionTime).toBeLessThan(200);

    // Vérifier que le formulaire est soumis
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });
  });

  it('should handle validation efficiently', async () => {
    render(
      <AuthWrapper>
        <DocumentForm {...defaultProps} />
      </AuthWrapper>
    );

    const startTime = performance.now();

    // Simuler une soumission sans remplir les champs requis
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    const endTime = performance.now();
    const validationTime = endTime - startTime;

    // Vérifier que la validation prend moins de 50ms
    expect(validationTime).toBeLessThan(50);

    // Vérifier que les messages d'erreur sont affichés
    expect(screen.getByText(/le nom est requis/i)).toBeInTheDocument();
    expect(screen.getByText(/le fichier est requis/i)).toBeInTheDocument();
  });

  it('should handle file upload efficiently', async () => {
    render(
      <AuthWrapper>
        <DocumentForm {...defaultProps} />
      </AuthWrapper>
    );

    const startTime = performance.now();

    // Simuler la sélection d'un fichier
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/fichier/i);
    fireEvent.change(input, { target: { files: [file] } });

    const endTime = performance.now();
    const uploadTime = endTime - startTime;

    // Vérifier que la gestion du fichier prend moins de 100ms
    expect(uploadTime).toBeLessThan(100);

    // Vérifier que le nom du fichier est affiché
    expect(screen.getByText(/test.pdf/i)).toBeInTheDocument();
  });

  it('should handle form reset efficiently', async () => {
    render(
      <AuthWrapper>
        <DocumentForm {...defaultProps} />
      </AuthWrapper>
    );

    // Remplir le formulaire
    fireEvent.change(screen.getByLabelText(/nom/i), {
      target: { value: 'Test Document' }
    });
    fireEvent.change(screen.getByLabelText(/type/i), {
      target: { value: 'cv' }
    });

    const startTime = performance.now();

    // Simuler la réinitialisation
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));

    const endTime = performance.now();
    const resetTime = endTime - startTime;

    // Vérifier que la réinitialisation prend moins de 50ms
    expect(resetTime).toBeLessThan(50);

    // Vérifier que le modal est fermé
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
}); 