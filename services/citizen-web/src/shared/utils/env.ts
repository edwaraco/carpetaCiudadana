/**
 * Environment Variables Helper
 * Provides access to runtime config (Kubernetes) or environment variables
 *
 * Priority:
 * 1. Runtime config (window.__RUNTIME_CONFIG__ from Kubernetes ConfigMap)
 * 2. Vite environment variables (import.meta.env from .env)
 * 3. Process environment (tests only)
 */

// Check if we're in test environment
const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

// In test mode, use process.env. In Vite mode, import.meta.env will be replaced at build time
const env = isTest ? process.env : import.meta.env;

/**
 * Gets environment variable value with runtime config support
 */
export function getEnvVar(key: string): string | undefined {
  // Try runtime config first (Kubernetes/Docker)
  if (typeof window !== 'undefined') {
    const config = window.__RUNTIME_CONFIG__;
    const runtimeValue = config ? config[key as keyof typeof config] : undefined;
    if (runtimeValue !== undefined) {
      return runtimeValue;
    }
  }

  // Fallback to build-time env
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

/**
 * Get Document Authentication Service base URL
 */
export function getDocumentAuthServiceURL(): string {
  return getEnvVar('VITE_DOCUMENT_AUTH_SERVICE_URL') || 'http://localhost:8083';
}

