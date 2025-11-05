/**
 * Hook for checking portability status
 */

import { useState, useEffect } from 'react';
import { portabilityService } from '../infrastructure';
import { CheckPortabilityResponse } from '../domain/types';

interface UsePortabilityStatusReturn {
  portabilityStatus: CheckPortabilityResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePortabilityStatus = (): UsePortabilityStatusReturn => {
  const [portabilityStatus, setPortabilityStatus] = useState<CheckPortabilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await portabilityService.checkPortabilityStatus();

      if (response.success && response.data) {
        setPortabilityStatus(response.data);
      } else {
        setError(response.error?.message || 'Failed to check portability status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    portabilityStatus,
    isLoading,
    error,
    refetch: fetchStatus,
  };
};

