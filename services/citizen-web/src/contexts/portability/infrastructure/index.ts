/**
 * Portability Service Factory
 *
 * Crea el servicio de portabilidad apropiado basado en la configuración de mocks.
 * Soporta configuración granular por contexto.
 */

import type { IPortabilityService } from './IPortabilityService';
import { PortabilityApiService } from './api/PortabilityApiService';
import { PortabilityMockService } from './mocks/PortabilityMockService';
import { shouldUseMock } from '@/shared/config/mockConfig';

function createPortabilityService(): IPortabilityService {
  if (shouldUseMock('PORTABILITY')) {
    console.log('🔧 [Portability] Using MOCK Service');
    return new PortabilityMockService();
  }
  console.log('🚀 [Portability] Using REAL API Service');
  return new PortabilityApiService();
}

export const portabilityService: IPortabilityService = createPortabilityService();

export type { IPortabilityService };
export { PortabilityApiService, PortabilityMockService };

