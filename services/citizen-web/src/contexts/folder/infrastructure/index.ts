/**
 * Folder Service Factory (Carpeta Personal)
 *
 * Crea el servicio de carpeta apropiado basado en la configuración de mocks.
 * Soporta configuración granular por contexto.
 */

import type { IFolderService } from './IFolderService';
import { FolderApiService } from './api/FolderApiService';
import { FolderMockService } from './mocks/FolderMockService';
import { shouldUseMock } from '@/shared/config/mockConfig';

function createFolderService(): IFolderService {
  if (shouldUseMock('CARPETA')) {
    console.log('🔧 [Carpeta] Using MOCK Service');
    return new FolderMockService();
  }
  console.log('🚀 [Carpeta] Using REAL API Service');
  return new FolderApiService();
}

export const folderService: IFolderService = createFolderService();

export type { IFolderService };
export { FolderApiService, FolderMockService };

