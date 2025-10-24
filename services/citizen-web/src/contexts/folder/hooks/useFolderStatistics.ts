/**
 * Hook for fetching folder statistics
 */

import { useState, useEffect } from 'react';
import { folderService } from '../infrastructure';
import { FolderStatistics } from '../domain/types';

interface UseFolderStatisticsReturn {
  statistics: FolderStatistics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useFolderStatistics = (): UseFolderStatisticsReturn => {
  const [statistics, setStatistics] = useState<FolderStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await folderService.getStatistics();

      if (response.success && response.data) {
        setStatistics(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return {
    statistics,
    isLoading,
    error,
    refetch: fetchStatistics,
  };
};

