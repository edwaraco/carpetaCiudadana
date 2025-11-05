/**
 * Environment Variables Helper
 * Provides access to Vite environment variables with Jest compatibility
 *
 * In production/dev (Vite), variables come from import.meta.env
 * In tests (Jest), variables come from process.env (mocked in setupTests.ts)
 */

// Check if we're in test environment
const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

// In test mode, use process.env. In Vite mode, import.meta.env will be replaced at build time
const env = isTest ? process.env : import.meta.env;

/**
 * Gets environment variable value
 */
export function getEnvVar(key: string): string | undefined {
  return env[key] as string | undefined;
}

/**
 * Check if we should use mock API
 */
export function isMockAPIEnabled(): boolean {
  return getEnvVar('VITE_USE_MOCK_API') === 'true';
}

/**
 * Get API base URL
 */
export function getAPIBaseURL(): string {
  return getEnvVar('VITE_API_BASE_URL') || 'http://localhost:8080/api';
}

/**
 * Check if MFA is required
 */
export function isMFARequired(): boolean {
  return getEnvVar('VITE_MFA_REQUIRED') === 'true';
}

