/**
 * Authentication Service Factory
 *
 * Crea el servicio de autenticación apropiado basado en la configuración de mocks.
 * Soporta configuración granular por contexto.
 */

import type { IAuthService } from './IAuthService';
import { AuthApiService } from './api/AuthApiService';
import { AuthMockService } from './mocks/AuthMockService';
import { shouldUseMock } from '@/shared/config/mockConfig';

// Factory function to create the appropriate service implementation
function createAuthService(): IAuthService {
  if (shouldUseMock('AUTHENTICATION')) {
    console.log('🔧 [Authentication] Using MOCK Service');
    return new AuthMockService();
  }
  console.log('🚀 [Authentication] Using REAL API Service');
  return new AuthApiService();
}

// Export singleton instance
export const authService: IAuthService = createAuthService();

// Also export the interface and classes for testing purposes
export type { IAuthService };
export { AuthApiService, AuthMockService };

