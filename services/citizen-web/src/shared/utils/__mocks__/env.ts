/**
 * Mock for env.ts - used by Jest tests
 * Avoids import.meta.env which Jest cannot parse
 */

export function getEnvVar(key: string): string | undefined {
  return process.env[key];
}

export function isMockAPIEnabled(): boolean {
  return process.env.VITE_USE_MOCK_API === 'true';
}

export function getAPIBaseURL(): string {
  return process.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
}

export function isMFARequired(): boolean {
  return process.env.VITE_MFA_REQUIRED === 'true';
}

