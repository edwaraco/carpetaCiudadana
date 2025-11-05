/**
 * Folder Service Factory
 */

import { IFolderService } from './IFolderService';
import { FolderApiService } from './api/FolderApiService';
import { FolderMockService } from './mocks/FolderMockService';
import { isMockAPIEnabled } from '@/shared/utils/env';

function createFolderService(): IFolderService {
  if (isMockAPIEnabled()) {
    console.log('🔧 Using MOCK Folder Service');
    return new FolderMockService();
  }
  console.log('🚀 Using REAL Folder Service');
  return new FolderApiService();
}

export const folderService: IFolderService = createFolderService();

export type { IFolderService };
export { FolderApiService, FolderMockService };

