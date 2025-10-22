/**
 * Folder Service Interface
 * Contract for folder management operations
 */

import { ApiResponse } from '../../../shared/utils/api.types';
import { CitizenFolder, FolderStatistics } from '../domain/types';

export interface IFolderService {
  // Get citizen's folder
  getFolder(): Promise<ApiResponse<CitizenFolder>>;

  // Get folder statistics
  getStatistics(): Promise<ApiResponse<FolderStatistics>>;

  // Check storage availability
  checkStorageAvailability(fileSizeBytes: number): Promise<ApiResponse<{ available: boolean; reason?: string }>>;
}

