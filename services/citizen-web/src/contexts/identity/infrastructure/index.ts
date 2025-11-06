/**
 * Identity Service Factory
 *
 * Crea el servicio de identidad apropiado basado en la configuración de mocks.
 * Soporta configuración granular por contexto.
 */

import type { IIdentityService } from './IIdentityService';
import { IdentityApiService } from './api/IdentityApiService';
import { IdentityMockService } from './mocks/IdentityMockService';
import { shouldUseMock } from '@/shared/config/mockConfig';

function createIdentityService(): IIdentityService {
  if (shouldUseMock('IDENTITY')) {
    console.log('🔧 [Identity] Using MOCK Service');
    return new IdentityMockService();
  }
  console.log('🚀 [Identity] Using REAL API Service');
  return new IdentityApiService();
}

export const identityService: IIdentityService = createIdentityService();

export type { IIdentityService };
export { IdentityApiService, IdentityMockService };

