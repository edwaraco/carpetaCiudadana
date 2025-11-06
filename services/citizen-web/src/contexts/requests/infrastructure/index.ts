/**
 * Request Service Factory (Document Requests)
 *
 * Crea el servicio de solicitudes apropiado basado en la configuración de mocks.
 * Soporta configuración granular por contexto.
 */

import type { IRequestService } from './IRequestService';
import { RequestApiService } from './api/RequestApiService';
import { RequestMockService } from './mocks/RequestMockService';
import { shouldUseMock } from '@/shared/config/mockConfig';

function createRequestService(): IRequestService {
  if (shouldUseMock('REQUESTS')) {
    console.log('🔧 [Requests] Using MOCK Service');
    return new RequestMockService();
  }
  console.log('🚀 [Requests] Using REAL API Service');
  return new RequestApiService();
}

export const requestService: IRequestService = createRequestService();

export type { IRequestService };
export { RequestApiService, RequestMockService };

