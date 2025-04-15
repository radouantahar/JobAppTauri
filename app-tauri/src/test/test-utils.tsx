import React from 'react';
import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

// Mock de window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  };
};

// Mock de navigator.share
window.navigator.share = window.navigator.share || (() => Promise.resolve());

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MantineProvider>
      <MemoryRouter>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </MemoryRouter>
    </MantineProvider>
  );
} 