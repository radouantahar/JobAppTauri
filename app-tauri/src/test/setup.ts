import '@testing-library/jest-dom';
import { afterEach } from '@jest/globals';
import { cleanup } from '@testing-library/react';

declare global {
  namespace Vi {
    interface Assertion {
      toBeInTheDocument(): void;
    }
  }
}

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock de window.performance
const mockPerformance = {
  now: () => Date.now(),
  memory: {
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
  },
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
}); 