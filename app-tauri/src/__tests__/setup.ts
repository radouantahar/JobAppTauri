import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';

// Déclaration des types globaux
declare global {
  interface Window {
    invoke: (command: string, args: any) => Promise<any>;
  }
}

// Setup initial avant tous les tests
beforeAll(() => {
  // Mock de window.invoke
  window.invoke = vi.fn();
});

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
});

// Extend expect with jest-dom matchers
expect.extend({
  toBeInTheDocument: (received: Element) => {
    const pass = document.body.contains(received);
    return {
      pass,
      message: () => `expected ${received} to be in the document`,
    };
  },
}); 