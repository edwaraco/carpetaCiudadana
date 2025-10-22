/**
 * Document Service Factory
 */

import { IDocumentService } from './IDocumentService';
import { DocumentApiService } from './api/DocumentApiService';
import { DocumentMockService } from './mocks/DocumentMockService';
import { useMockAPI } from '@/shared/utils/env';

function createDocumentService(): IDocumentService {
  if (useMockAPI()) {
    console.log('🔧 Using MOCK Document Service');
    return new DocumentMockService();
  }
  console.log('🚀 Using REAL Document Service');
  return new DocumentApiService();
}

export const documentService: IDocumentService = createDocumentService();

export type { IDocumentService };
export { DocumentApiService, DocumentMockService };

