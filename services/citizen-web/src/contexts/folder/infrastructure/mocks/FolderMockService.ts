/**
 * Folder Mock Service
 * Simulates folder management for development/testing
 */

import { ApiResponse } from '../../../../shared/utils/api.types';
import { IFolderService } from '../IFolderService';
import {
  CitizenFolder,
  FolderStatistics,
  STORAGE_LIMITS,
  MAX_TEMPORARY_SIZE_BYTES,
  BYTES_PER_MB,
} from '../../domain/types';

export class FolderMockService implements IFolderService {
  private mockFolder: CitizenFolder = {
    folderId: 'folder-001',
    owner: {
      cedula: '1234567890',
      fullName: 'Juan Pérez González',
      personalEmail: 'juan.perez@gmail.com',
      folderEmail: 'juan.perez@carpetacolombia.co',
      address: 'Calle 50 #45-67, Medellín, Antioquia, Colombia',
      currentOperator: 'MiCarpeta',
      registrationDate: new Date('2024-01-15'),
      status: 'ACTIVE',
    },
    documents: [],
    usedStorage: {
      certifiedDocuments: {
        count: 2,
        totalSizeBytes: 425600, // ~415 KB
      },
      temporaryDocuments: {
        count: 1,
        maxCount: STORAGE_LIMITS.maxTemporaryDocuments,
        totalSizeBytes: 95000, // ~93 KB
        maxSizeBytes: MAX_TEMPORARY_SIZE_BYTES,
      },
    },
    status: 'ACTIVE',
    creationDate: new Date('2024-01-15'),
  };

  async getFolder(cedula: string): Promise<ApiResponse<CitizenFolder>> {
    await this.simulateDelay();

    // For mock, return the folder regardless of cedula
    // In real implementation, this would filter by cedula
    console.info(`Mock: Fetching folder for cedula ${cedula}`);

    return {
      success: true,
      data: this.mockFolder,
      timestamp: new Date(),
    };
  }

  async getStatistics(): Promise<ApiResponse<FolderStatistics>> {
    await this.simulateDelay(400);

    const { usedStorage } = this.mockFolder;
    const totalUsedBytes = usedStorage.certifiedDocuments.totalSizeBytes + usedStorage.temporaryDocuments.totalSizeBytes;
    const usedSpaceMB = totalUsedBytes / BYTES_PER_MB;

    // Certified documents have unlimited storage, only count temporary
    const maxTemporarySizeMB = STORAGE_LIMITS.maxTemporarySizeMB;
    const temporaryUsedMB = usedStorage.temporaryDocuments.totalSizeBytes / BYTES_PER_MB;
    const availableSpaceMB = maxTemporarySizeMB - temporaryUsedMB;
    const usagePercentage = (temporaryUsedMB / maxTemporarySizeMB) * 100;

    const statistics: FolderStatistics = {
      totalDocuments: usedStorage.certifiedDocuments.count + usedStorage.temporaryDocuments.count,
      certifiedDocuments: usedStorage.certifiedDocuments.count,
      temporaryDocuments: usedStorage.temporaryDocuments.count,
      usedSpaceMB: parseFloat(usedSpaceMB.toFixed(2)),
      availableSpaceMB: parseFloat(availableSpaceMB.toFixed(2)),
      usagePercentage: parseFloat(usagePercentage.toFixed(2)),
    };

    return {
      success: true,
      data: statistics,
      timestamp: new Date(),
    };
  }

  async checkStorageAvailability(
    fileSizeBytes: number
  ): Promise<ApiResponse<{ available: boolean; reason?: string }>> {
    await this.simulateDelay(200);

    const { usedStorage } = this.mockFolder;

    // Check if adding this file would exceed temporary document count limit
    if (usedStorage.temporaryDocuments.count >= STORAGE_LIMITS.maxTemporaryDocuments) {
      return {
        success: true,
        data: {
          available: false,
          reason: `Maximum temporary documents limit reached (${STORAGE_LIMITS.maxTemporaryDocuments})`,
        },
        timestamp: new Date(),
      };
    }

    // Check if adding this file would exceed temporary storage size limit
    const newTotalSize = usedStorage.temporaryDocuments.totalSizeBytes + fileSizeBytes;
    if (newTotalSize > MAX_TEMPORARY_SIZE_BYTES) {
      const availableMB = (MAX_TEMPORARY_SIZE_BYTES - usedStorage.temporaryDocuments.totalSizeBytes) / BYTES_PER_MB;
      return {
        success: true,
        data: {
          available: false,
          reason: `Insufficient storage space. Available: ${availableMB.toFixed(2)} MB`,
        },
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      data: {
        available: true,
      },
      timestamp: new Date(),
    };
  }

  private simulateDelay(ms: number = 500): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

