import '@testing-library/jest-dom/vitest';
import { vi, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock de window.performance
const mockPerformance = {
  now: vi.fn(() => Date.now()),
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