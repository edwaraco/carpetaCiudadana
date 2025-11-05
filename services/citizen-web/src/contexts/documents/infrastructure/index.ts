/**
 * Document Service Factory
 *
 * Crea el servicio de documentos apropiado basado en la configuración de mocks.
 * Soporta configuración granular por contexto.
 */

import type { IDocumentService } from './IDocumentService';
import { DocumentApiService } from './api/DocumentApiService';
import { DocumentMockService } from './mocks/DocumentMockService';
import { shouldUseMock } from '@/shared/config/mockConfig';

function createDocumentService(): IDocumentService {
  if (shouldUseMock('DOCUMENTS')) {
    console.log('🔧 [Documents] Using MOCK Service');
    return new DocumentMockService();
  }
  console.log('🚀 [Documents] Using REAL API Service');
  return new DocumentApiService();
}

export const documentService: IDocumentService = createDocumentService();

export type { IDocumentService };
export { DocumentApiService, DocumentMockService };

