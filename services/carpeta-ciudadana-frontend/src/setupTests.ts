/**
 * Jest Setup
 * Configuration for testing environment
 */

import '@testing-library/jest-dom';

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

// Mock env module to avoid import.meta issues
jest.mock('@/shared/utils/env');

// Set environment variables for tests
process.env.NODE_ENV = 'test';
process.env.VITE_USE_MOCK_API = 'true';
process.env.VITE_API_BASE_URL = 'http://localhost:8080/api';
process.env.VITE_MFA_REQUIRED = 'false';

// Mock window.matchMedia (required by Material-UI)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
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

