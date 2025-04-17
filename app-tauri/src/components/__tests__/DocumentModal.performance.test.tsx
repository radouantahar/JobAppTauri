import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { DocumentModal } from '../DocumentModal';
import type { AuthContextType } from '@/contexts/AuthContext';
import type { Document } from '@/types';
import { createISODateString } from '@/__tests__/fixtures/date';

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

// Mock du document
const mockDocument: Document = {
  id: '1',
  userId: '1',
  name: 'Test Document',
  type: 'cv',
  description: 'Test description',
  content: 'Test content',
  size: 1000,
  url: 'http://example.com',
  filePath: '/path/to/file',
  createdAt: createISODateString(new Date()),
  updatedAt: createISODateString(new Date())
};

// Mock des props du document
const mockDocumentProps = {
  document: mockDocument,
  opened: true,
  onClose: vi.fn()
};

// Wrapper pour fournir le contexte d'authentification
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
};

describe('DocumentModal Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render document details quickly', async () => {
    const startTime = performance.now();
    
    render(
      <AuthWrapper>
        <DocumentModal {...mockDocumentProps} />
      </AuthWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Vérifier que le rendu prend moins de 100ms
    expect(renderTime).toBeLessThan(100);

    // Vérifier que les éléments sont présents
    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should handle document update efficiently', async () => {
    render(
      <AuthWrapper>
        <DocumentModal {...mockDocumentProps} />
      </AuthWrapper>
    );

    const startTime = performance.now();

    // Simuler la mise à jour du document
    fireEvent.click(screen.getByRole('button', { name: /mettre à jour/i }));

    const endTime = performance.now();
    const updateTime = endTime - startTime;

    // Vérifier que la mise à jour prend moins de 200ms
    expect(updateTime).toBeLessThan(200);
  });

  it('should handle document deletion efficiently', async () => {
    render(
      <AuthWrapper>
        <DocumentModal {...mockDocumentProps} />
      </AuthWrapper>
    );

    const startTime = performance.now();

    // Simuler la suppression du document
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }));

    const endTime = performance.now();
    const deleteTime = endTime - startTime;

    // Vérifier que la suppression prend moins de 200ms
    expect(deleteTime).toBeLessThan(200);
  });

  it('should handle modal close efficiently', async () => {
    render(
      <AuthWrapper>
        <DocumentModal {...mockDocumentProps} />
      </AuthWrapper>
    );

    const startTime = performance.now();

    // Simuler la fermeture du modal
    fireEvent.click(screen.getByRole('button', { name: /fermer/i }));

    const endTime = performance.now();
    const closeTime = endTime - startTime;

    // Vérifier que la fermeture prend moins de 100ms
    expect(closeTime).toBeLessThan(100);

    // Vérifier que onClose a été appelé
    expect(mockDocumentProps.onClose).toHaveBeenCalled();
  });

  it('should measure memory usage', async () => {
    const startHeap = process.memoryUsage().heapUsed;
    
    render(
      <AuthWrapper>
        <DocumentModal {...mockDocumentProps} />
      </AuthWrapper>
    );

    const endHeap = process.memoryUsage().heapUsed;
    const memoryDiff = endHeap - startHeap;

    // Vérifier que l'utilisation de la mémoire est raisonnable
    expect(memoryDiff).toBeLessThan(1024 * 1024); // Moins de 1MB
  });
}); 