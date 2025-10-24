/**
 * Vitest Setup
 * Configuration for testing environment
 */

import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { mockFeatureFlagsModule, resetFeatureFlagsForTest } from './mocks/featureFlags';

// Mock feature flags globally - todas las features habilitadas por defecto en tests
vi.mock('@/shared/config/featureFlags', () => mockFeatureFlagsModule);

// Reset feature flags después de cada test
afterEach(() => {
  resetFeatureFlagsForTest();
});

// Suppress console logs BEFORE any imports
const originalLog = console.log;
console.log = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Using MOCK') || args[0].includes('Using REAL'))
  ) {
    return;
  }
  originalLog.call(console, ...args);
};

// Mock window.matchMedia (required by Material-UI)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Suppress specific console warnings during tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress React act() warnings from Material-UI internal updates
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: An update to') ||
       args[0].includes('inside a test was not wrapped in act') ||
       args[0].includes('When testing, code that causes React state updates'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    // Suppress specific warnings if needed
    if (typeof args[0] === 'string' && args[0].includes('deprecated')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});

