/**
 * Mock de Feature Flags para Tests
 *
 * Este archivo proporciona funciones para mockear feature flags durante tests.
 * Por defecto, todas las features están habilitadas en tests.
 */

import { vi } from 'vitest';
import type { FeatureFlag } from '@/shared/config/featureFlags';

/**
 * Estado de las feature flags en tests
 * Por defecto, todas están habilitadas
 */
let mockFeatureFlags: Record<FeatureFlag, boolean> = {
  PORTABILITY: true,
  DOCUMENT_REQUESTS: true,
  DOCUMENTS: true,
  UPLOAD_DOCUMENTS: true,
  DOWNLOAD_DOCUMENTS: true,
  DELETE_DOCUMENTS: true,
  STORAGE_STATS: true,
  RECENT_ACTIVITY: true,
  MFA: true,
  REGISTRATION: true,
  AUDIT_LOGS: true,
};

/**
 * Sobrescribe feature flags específicas para un test
 *
 * @param overrides - Objeto con las flags a sobrescribir
 *
 * @example
 * import { mockFeatureFlagsForTest } from '@/test/mocks/featureFlags';
 *
 * describe('MyComponent', () => {
 *   it('should hide portability when disabled', () => {
 *     mockFeatureFlagsForTest({ PORTABILITY: false });
 *     // ... test code
 *   });
 * });
 */
export function mockFeatureFlagsForTest(overrides: Partial<Record<FeatureFlag, boolean>>): void {
  mockFeatureFlags = { ...mockFeatureFlags, ...overrides };
}

/**
 * Resetea todas las feature flags a su estado por defecto (todas habilitadas)
 *
 * @example
 * import { resetFeatureFlagsForTest } from '@/test/mocks/featureFlags';
 *
 * afterEach(() => {
 *   resetFeatureFlagsForTest();
 * });
 */
export function resetFeatureFlagsForTest(): void {
  mockFeatureFlags = {
    PORTABILITY: true,
    DOCUMENT_REQUESTS: true,
    DOCUMENTS: true,
    UPLOAD_DOCUMENTS: true,
    DOWNLOAD_DOCUMENTS: true,
    DELETE_DOCUMENTS: true,
    STORAGE_STATS: true,
    RECENT_ACTIVITY: true,
    MFA: true,
    REGISTRATION: true,
    AUDIT_LOGS: true,
  };
}

/**
 * Deshabilita todas las feature flags
 *
 * @example
 * import { disableAllFeatureFlagsForTest } from '@/test/mocks/featureFlags';
 *
 * it('should work with no features enabled', () => {
 *   disableAllFeatureFlagsForTest();
 *   // ... test code
 * });
 */
export function disableAllFeatureFlagsForTest(): void {
  Object.keys(mockFeatureFlags).forEach((flag) => {
    mockFeatureFlags[flag as FeatureFlag] = false;
  });
}

/**
 * Función mockeada de isFeatureEnabled
 * Retorna el valor del mock en lugar del valor real
 */
export const mockIsFeatureEnabled = vi.fn((flag: FeatureFlag): boolean => {
  return mockFeatureFlags[flag];
});

/**
 * Función mockeada de areAllFeaturesEnabled
 */
export const mockAreAllFeaturesEnabled = vi.fn((flags: FeatureFlag[]): boolean => {
  return flags.every(flag => mockFeatureFlags[flag]);
});

/**
 * Función mockeada de isAnyFeatureEnabled
 */
export const mockIsAnyFeatureEnabled = vi.fn((flags: FeatureFlag[]): boolean => {
  return flags.some(flag => mockFeatureFlags[flag]);
});

/**
 * Mock module completo para feature flags
 * Usa esto con vi.mock en tus tests
 *
 * @example
 * import { mockFeatureFlagsModule } from '@/test/mocks/featureFlags';
 *
 * vi.mock('@/shared/config/featureFlags', () => mockFeatureFlagsModule);
 */
export const mockFeatureFlagsModule = {
  isFeatureEnabled: mockIsFeatureEnabled,
  areAllFeaturesEnabled: mockAreAllFeaturesEnabled,
  isAnyFeatureEnabled: mockIsAnyFeatureEnabled,
  featureFlags: mockFeatureFlags,
  getEnabledFeatures: vi.fn(() =>
    Object.entries(mockFeatureFlags)
      .filter(([_, enabled]) => enabled)
      .map(([flag]) => flag as FeatureFlag)
  ),
  getDisabledFeatures: vi.fn(() =>
    Object.entries(mockFeatureFlags)
      .filter(([_, enabled]) => !enabled)
      .map(([flag]) => flag as FeatureFlag)
  ),
};

