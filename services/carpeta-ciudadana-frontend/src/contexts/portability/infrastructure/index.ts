/**
 * Portability Service Factory
 */

import { IPortabilityService } from './IPortabilityService';
import { PortabilityApiService } from './api/PortabilityApiService';
import { PortabilityMockService } from './mocks/PortabilityMockService';
import { useMockAPI } from '@/shared/utils/env';

function createPortabilityService(): IPortabilityService {
  if (useMockAPI()) {
    console.log('🔧 Using MOCK Portability Service');
    return new PortabilityMockService();
  }
  console.log('🚀 Using REAL Portability Service');
  return new PortabilityApiService();
}

export const portabilityService: IPortabilityService = createPortabilityService();

export type { IPortabilityService };
export { PortabilityApiService, PortabilityMockService };

