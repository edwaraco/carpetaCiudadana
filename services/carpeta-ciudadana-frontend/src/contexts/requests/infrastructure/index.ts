/**
 * Request Service Factory
 */

import { IRequestService } from './IRequestService';
import { RequestApiService } from './api/RequestApiService';
import { RequestMockService } from './mocks/RequestMockService';
import { useMockAPI } from '@/shared/utils/env';

function createRequestService(): IRequestService {
  if (useMockAPI()) {
    console.log('🔧 Using MOCK Request Service');
    return new RequestMockService();
  }
  console.log('🚀 Using REAL Request Service');
  return new RequestApiService();
}

export const requestService: IRequestService = createRequestService();

export type { IRequestService };
export { RequestApiService, RequestMockService };

