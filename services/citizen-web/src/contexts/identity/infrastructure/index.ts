/**
 * Identity Service Factory
 */

import { IIdentityService } from './IIdentityService';
import { IdentityApiService } from './api/IdentityApiService';
import { IdentityMockService } from './mocks/IdentityMockService';
import { isMockAPIEnabled } from '@/shared/utils/env';

function createIdentityService(): IIdentityService {
  if (isMockAPIEnabled()) {
    console.log('🔧 Using MOCK Identity Service');
    return new IdentityMockService();
  }
  console.log('🚀 Using REAL Identity Service');
  return new IdentityApiService();
}

export const identityService: IIdentityService = createIdentityService();

export type { IIdentityService };
export { IdentityApiService, IdentityMockService };

