import '@testing-library/jest-dom';

// Mock de window.performance
const mockPerformance = {
  now: jest.fn(() => Date.now()),
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

// Extensions pour les tests de performance
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
} 