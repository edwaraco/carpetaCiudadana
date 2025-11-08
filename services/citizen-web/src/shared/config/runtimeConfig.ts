/**
 * Runtime Configuration Utility
 *
 * This utility provides access to runtime configuration injected by Kubernetes ConfigMap.
 * It fallbacks to build-time environment variables for local development.
 *
 * Priority:
 * 1. window.__RUNTIME_CONFIG__ (Kubernetes/Docker)
 * 2. import.meta.env (Local development with .env)
 */

interface RuntimeConfig {
  VITE_API_BASE_URL: string;
  VITE_OPERATOR_ID: string;
  VITE_OPERATOR_NAME: string;
  VITE_MFA_REQUIRED: string;
  VITE_FEATURE_PORTABILITY: string;
  VITE_FEATURE_DOCUMENT_REQUESTS: string;
  VITE_FEATURE_DOCUMENTS: string;
  VITE_FEATURE_UPLOAD_DOCUMENTS: string;
  VITE_FEATURE_DOWNLOAD_DOCUMENTS: string;
  VITE_FEATURE_DELETE_DOCUMENTS: string;
  VITE_FEATURE_NOTIFICATIONS: string;
  VITE_FEATURE_STORAGE_STATS: string;
  VITE_FEATURE_RECENT_ACTIVITY: string;
  VITE_FEATURE_MFA: string;
  VITE_FEATURE_REGISTRATION: string;
  VITE_FEATURE_AUDIT_LOGS: string;
  VITE_USE_MOCKS: string;
  VITE_MOCK_AUTHENTICATION: string;
  VITE_MOCK_IDENTITY: string;
  VITE_MOCK_DOCUMENTS: string;
  VITE_MOCK_CARPETA: string;
  VITE_MOCK_PORTABILITY: string;
  VITE_MOCK_REQUESTS: string;
  VITE_MOCK_NOTIFICATIONS: string;
  VITE_MOCK_AUDIT: string;
}

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

/**
 * Get a configuration value with fallback
 * @param key - The configuration key
 * @returns The configuration value
 */
export function getConfig(key: keyof RuntimeConfig): string {
  // Try runtime config first (Kubernetes/Docker)
  const runtimeValue = window.__RUNTIME_CONFIG__?.[key];
  if (runtimeValue !== undefined) {
    return runtimeValue;
  }

  // Fallback to build-time env (local development)
  return import.meta.env[key] as string;
}

/**
 * Get a boolean configuration value
 * @param key - The configuration key
 * @param defaultValue - Default value if not found
 * @returns Boolean value
 */
export function getBooleanConfig(key: keyof RuntimeConfig, defaultValue = false): boolean {
  const value = getConfig(key);
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Check if we're running with runtime config (Kubernetes/Docker)
 * @returns true if runtime config is available
 */
export function hasRuntimeConfig(): boolean {
  return window.__RUNTIME_CONFIG__ !== undefined;
}

/**
 * Get all configuration as an object
 * @returns Configuration object
 */
export function getAllConfig(): Partial<RuntimeConfig> {
  if (hasRuntimeConfig()) {
    return window.__RUNTIME_CONFIG__ || {};
  }

  // Return build-time env for local development
  return {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_OPERATOR_ID: import.meta.env.VITE_OPERATOR_ID,
    VITE_OPERATOR_NAME: import.meta.env.VITE_OPERATOR_NAME,
    VITE_MFA_REQUIRED: import.meta.env.VITE_MFA_REQUIRED,
    VITE_FEATURE_PORTABILITY: import.meta.env.VITE_FEATURE_PORTABILITY,
    VITE_FEATURE_DOCUMENT_REQUESTS: import.meta.env.VITE_FEATURE_DOCUMENT_REQUESTS,
    VITE_FEATURE_DOCUMENTS: import.meta.env.VITE_FEATURE_DOCUMENTS,
    VITE_FEATURE_UPLOAD_DOCUMENTS: import.meta.env.VITE_FEATURE_UPLOAD_DOCUMENTS,
    VITE_FEATURE_DOWNLOAD_DOCUMENTS: import.meta.env.VITE_FEATURE_DOWNLOAD_DOCUMENTS,
    VITE_FEATURE_DELETE_DOCUMENTS: import.meta.env.VITE_FEATURE_DELETE_DOCUMENTS,
    VITE_FEATURE_NOTIFICATIONS: import.meta.env.VITE_FEATURE_NOTIFICATIONS,
    VITE_FEATURE_STORAGE_STATS: import.meta.env.VITE_FEATURE_STORAGE_STATS,
    VITE_FEATURE_RECENT_ACTIVITY: import.meta.env.VITE_FEATURE_RECENT_ACTIVITY,
    VITE_FEATURE_MFA: import.meta.env.VITE_FEATURE_MFA,
    VITE_FEATURE_REGISTRATION: import.meta.env.VITE_FEATURE_REGISTRATION,
    VITE_FEATURE_AUDIT_LOGS: import.meta.env.VITE_FEATURE_AUDIT_LOGS,
    VITE_USE_MOCKS: import.meta.env.VITE_USE_MOCKS,
    VITE_MOCK_AUTHENTICATION: import.meta.env.VITE_MOCK_AUTHENTICATION,
    VITE_MOCK_IDENTITY: import.meta.env.VITE_MOCK_IDENTITY,
    VITE_MOCK_DOCUMENTS: import.meta.env.VITE_MOCK_DOCUMENTS,
    VITE_MOCK_CARPETA: import.meta.env.VITE_MOCK_CARPETA,
    VITE_MOCK_PORTABILITY: import.meta.env.VITE_MOCK_PORTABILITY,
    VITE_MOCK_REQUESTS: import.meta.env.VITE_MOCK_REQUESTS,
    VITE_MOCK_NOTIFICATIONS: import.meta.env.VITE_MOCK_NOTIFICATIONS,
    VITE_MOCK_AUDIT: import.meta.env.VITE_MOCK_AUDIT,
  };
}

