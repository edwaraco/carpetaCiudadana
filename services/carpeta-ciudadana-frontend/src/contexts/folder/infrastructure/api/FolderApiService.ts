/**
 * Folder API Service - Real Implementation
 */

import { httpClient } from '../../../../shared/utils/httpClient';
import { ApiResponse } from '../../../../shared/utils/api.types';
import { IFolderService } from '../IFolderService';
import { CitizenFolder, FolderStatistics } from '../../domain/types';

export class FolderApiService implements IFolderService {
  async getFolder(): Promise<ApiResponse<CitizenFolder>> {
    return httpClient.get<CitizenFolder>('/folder');
  }

  async getStatistics(): Promise<ApiResponse<FolderStatistics>> {
    return httpClient.get<FolderStatistics>('/folder/statistics');
  }

  async checkStorageAvailability(
    fileSizeBytes: number
  ): Promise<ApiResponse<{ available: boolean; reason?: string }>> {
    return httpClient.get<{ available: boolean; reason?: string }>('/folder/storage/check', {
      params: { fileSizeBytes },
    });
  }
}

