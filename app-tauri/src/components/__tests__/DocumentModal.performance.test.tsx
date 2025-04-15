import React from 'react';
import { render, act } from '@testing-library/react';
import { DocumentModal } from '../DocumentModal';
import { useAuth } from '../../contexts/AuthContext';
import { useDocument } from '../../hooks/useDocument';

// Mock des hooks
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useDocument');

const mockUseAuth = useAuth as jest.Mock;
const mockUseDocument = useDocument as jest.Mock;

describe('DocumentModal Performance Tests', () => {
  const mockDocument = {
    id: '1',
    title: 'CV Développeur React',
    type: 'cv',
    content: 'Contenu du CV',
    lastUpdated: new Date().toISOString(),
    metadata: {
      template: 'default',
      version: '1.0',
    },
  };

  beforeEach(() => {
    // Configuration des mocks par défaut
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
    });

    mockUseDocument.mockReturnValue({
      document: mockDocument,
      isLoading: false,
      error: null,
      updateDocument: jest.fn(),
      deleteDocument: jest.fn(),
    });
  });

  it('devrait ouvrir le modal en moins de 300ms', () => {
    const startTime = performance.now();
    
    act(() => {
      render(<DocumentModal documentId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(300);
  });

  it('devrait gérer efficacement les états de chargement', () => {
    mockUseDocument.mockReturnValue({
      document: null,
      isLoading: true,
      error: null,
      updateDocument: jest.fn(),
      deleteDocument: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<DocumentModal documentId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(200);
  });

  it('devrait gérer efficacement les états d\'erreur', () => {
    mockUseDocument.mockReturnValue({
      document: null,
      isLoading: false,
      error: new Error('Erreur de chargement'),
      updateDocument: jest.fn(),
      deleteDocument: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<DocumentModal documentId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(200);
  });

  it('devrait maintenir une utilisation mémoire stable lors de multiples ouvertures/fermetures', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    const memorySamples: number[] = [];

    for (let i = 0; i < 10; i++) {
      act(() => {
        render(<DocumentModal documentId="1" onClose={() => {}} />);
      });

      if (performance.memory) {
        memorySamples.push(performance.memory.usedJSHeapSize);
      }
    }

    if (memorySamples.length > 0) {
      const maxMemoryIncrease = Math.max(...memorySamples) - initialMemory;
      expect(maxMemoryIncrease).toBeLessThan(3 * 1024 * 1024); // Moins de 3MB d'augmentation
    }
  });

  it('devrait gérer efficacement les documents volumineux', () => {
    const largeDocument = {
      ...mockDocument,
      content: 'Contenu très long'.repeat(1000),
      metadata: {
        ...mockDocument.metadata,
        size: '2MB',
        pages: 50,
      },
    };

    mockUseDocument.mockReturnValue({
      document: largeDocument,
      isLoading: false,
      error: null,
      updateDocument: jest.fn(),
      deleteDocument: jest.fn(),
    });

    const startTime = performance.now();
    
    act(() => {
      render(<DocumentModal documentId="1" onClose={() => {}} />);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(500);
  });
}); 