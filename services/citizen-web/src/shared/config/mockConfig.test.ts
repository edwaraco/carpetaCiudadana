/**
 * Mock Configuration Tests
 * Verifica que el sistema de mocks granulares funciona correctamente
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Mock Configuration', () => {
  // Backup original env
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear all VITE_* env variables to avoid contamination from .env files
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        delete process.env[key];
      }
    });

    // Reset modules to force re-import with new env values
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  describe('shouldUseMock', () => {
    it('should return false for all contexts when USE_MOCKS_GLOBAL is false', async () => {
      // Setup test environment
      process.env.VITE_USE_MOCKS = 'false';
      process.env.NODE_ENV = 'test';

      // Re-import module with new env
      const { shouldUseMock } = await import('./mockConfig');

      expect(shouldUseMock('AUTHENTICATION')).toBe(false);
      expect(shouldUseMock('DOCUMENTS')).toBe(false);
      expect(shouldUseMock('CARPETA')).toBe(false);
    });

    it('should respect granular configuration when USE_MOCKS_GLOBAL is true', async () => {
      process.env.VITE_USE_MOCKS = 'true';
      process.env.VITE_MOCK_CARPETA = 'false';
      process.env.VITE_MOCK_DOCUMENTS = 'false';
      process.env.NODE_ENV = 'test';

      const { shouldUseMock } = await import('./mockConfig');

      // Estos deben estar deshabilitados por configuración explícita
      expect(shouldUseMock('CARPETA')).toBe(false);
      expect(shouldUseMock('DOCUMENTS')).toBe(false);

      // Estos deben estar habilitados por defecto
      expect(shouldUseMock('AUTHENTICATION')).toBe(true);
      expect(shouldUseMock('IDENTITY')).toBe(true);
    });

    it('should use default values when no env vars are set', async () => {
      process.env.VITE_USE_MOCKS = 'true';
      process.env.NODE_ENV = 'test';

      const { shouldUseMock } = await import('./mockConfig');

      // Todos deben usar el valor por defecto (true)
      expect(shouldUseMock('AUTHENTICATION')).toBe(true);
      expect(shouldUseMock('DOCUMENTS')).toBe(true);
      expect(shouldUseMock('CARPETA')).toBe(true);
    });
  });

  describe('getMockedContexts', () => {
    it('should return empty array when USE_MOCKS_GLOBAL is false', async () => {
      process.env.VITE_USE_MOCKS = 'false';
      process.env.NODE_ENV = 'test';

      const { getMockedContexts } = await import('./mockConfig');

      expect(getMockedContexts()).toEqual([]);
    });

    it('should return only enabled contexts', async () => {
      process.env.VITE_USE_MOCKS = 'true';
      process.env.VITE_MOCK_CARPETA = 'false';
      process.env.VITE_MOCK_DOCUMENTS = 'false';
      process.env.NODE_ENV = 'test';

      const { getMockedContexts } = await import('./mockConfig');

      const mocked = getMockedContexts();

      expect(mocked).not.toContain('CARPETA');
      expect(mocked).not.toContain('DOCUMENTS');
      expect(mocked).toContain('AUTHENTICATION');
      expect(mocked).toContain('IDENTITY');
    });
  });

  describe('getRealServiceContexts', () => {
    it('should return all contexts when USE_MOCKS_GLOBAL is false', async () => {
      process.env.VITE_USE_MOCKS = 'false';
      process.env.NODE_ENV = 'test';

      const { getRealServiceContexts } = await import('./mockConfig');

      const real = getRealServiceContexts();
      const allContexts = [
        'AUTHENTICATION',
        'IDENTITY',
        'DOCUMENTS',
        'CARPETA',
        'PORTABILITY',
        'REQUESTS',
        'NOTIFICATIONS',
        'AUDIT',
      ];

      expect(real.sort()).toEqual(allContexts.sort());
    });

    it('should return only disabled contexts when USE_MOCKS_GLOBAL is true', async () => {
      process.env.VITE_USE_MOCKS = 'true';
      process.env.VITE_MOCK_CARPETA = 'false';
      process.env.VITE_MOCK_DOCUMENTS = 'false';
      process.env.NODE_ENV = 'test';

      const { getRealServiceContexts } = await import('./mockConfig');

      const real = getRealServiceContexts();

      expect(real).toContain('CARPETA');
      expect(real).toContain('DOCUMENTS');
      expect(real).not.toContain('AUTHENTICATION');
    });
  });

  describe('getMockConfigSummary', () => {
    it('should provide correct summary with mixed configuration', async () => {
      process.env.VITE_USE_MOCKS = 'true';
      process.env.VITE_MOCK_CARPETA = 'false';
      process.env.NODE_ENV = 'test';

      const { getMockConfigSummary } = await import('./mockConfig');

      const summary = getMockConfigSummary();

      expect(summary.globalEnabled).toBe(true);
      expect(summary.realServiceContexts).toContain('CARPETA');
      expect(summary.mockedContexts).not.toContain('CARPETA');
      expect(summary.config).not.toBeNull();
    });

    it('should return null config when USE_MOCKS_GLOBAL is false', async () => {
      process.env.VITE_USE_MOCKS = 'false';
      process.env.NODE_ENV = 'test';

      const { getMockConfigSummary } = await import('./mockConfig');

      const summary = getMockConfigSummary();

      expect(summary.globalEnabled).toBe(false);
      expect(summary.config).toBeNull();
    });
  });
});

