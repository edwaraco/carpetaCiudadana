/**
 * Authentication Service Factory
 * Allows switching between mock and real implementations via environment variable
 */

import { IAuthService } from './IAuthService';
import { AuthApiService } from './api/AuthApiService';
import { AuthMockService } from './mocks/AuthMockService';
import { isMockAPIEnabled } from '@/shared/utils/env';

// Factory function to create the appropriate service implementation
function createAuthService(): IAuthService {
  if (isMockAPIEnabled()) {
    console.log('🔧 Using MOCK Authentication Service');
    return new AuthMockService();
  }
  console.log('🚀 Using REAL Authentication Service');
  return new AuthApiService();
}

// Export singleton instance
export const authService: IAuthService = createAuthService();

// Also export the interface and classes for testing purposes
export type { IAuthService };
export { AuthApiService, AuthMockService };

