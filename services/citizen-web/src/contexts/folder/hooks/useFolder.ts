/**
 * Hook for fetching folder information
 */

import { useState, useEffect } from 'react';
import { folderService } from '../infrastructure';
import { CitizenFolder } from '../domain/types';

interface UseFolderReturn {
  folder: CitizenFolder | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useFolder = (): UseFolderReturn => {
  const [folder, setFolder] = useState<CitizenFolder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFolder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await folderService.getFolder();

      if (response.success && response.data) {
        setFolder(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch folder');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFolder();
  }, []);

  return {
    folder,
    isLoading,
    error,
    refetch: fetchFolder,
  };
};

