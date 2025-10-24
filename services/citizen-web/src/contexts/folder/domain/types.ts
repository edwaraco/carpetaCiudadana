/**
 * Bounded Context: Personal Folder
 * Domain types for citizen's personal folder
 */

import { Citizen } from '../../identity/domain/types';
import { Document } from '../../documents/domain/types';

export interface CitizenFolder {
  folderId: string;
  owner: Citizen;
  documents: Document[];
  usedStorage: StorageSpace;
  status: FolderStatus;
  creationDate: Date;
}

export type FolderStatus = 'ACTIVE' | 'SUSPENDED' | 'MIGRATION';

export interface StorageSpace {
  certifiedDocuments: {
    count: number;
    totalSizeBytes: number;
  };
  temporaryDocuments: {
    count: number;
    maxCount: number; // Maximum 100
    totalSizeBytes: number;
    maxSizeBytes: number; // Maximum 500 MB (524288000 bytes)
  };
}

export interface FolderStatistics {
  totalDocuments: number;
  certifiedDocuments: number;
  temporaryDocuments: number;
  usedSpaceMB: number;
  availableSpaceMB: number;
  usagePercentage: number;
}

export interface StorageLimits {
  maxTemporaryDocuments: number;
  maxTemporarySizeMB: number;
}

// Domain constants
export const STORAGE_LIMITS: StorageLimits = {
  maxTemporaryDocuments: 100,
  maxTemporarySizeMB: 500,
};

export const BYTES_PER_MB = 1024 * 1024;
export const MAX_TEMPORARY_SIZE_BYTES = STORAGE_LIMITS.maxTemporarySizeMB * BYTES_PER_MB;

