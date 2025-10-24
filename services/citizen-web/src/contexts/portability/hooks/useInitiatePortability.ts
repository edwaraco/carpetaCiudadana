/**
 * Hook for initiating portability process
 */

import { useState } from 'react';
import { portabilityService } from '../infrastructure';
import { InitiatePortabilityRequest, InitiatePortabilityResponse } from '../domain/types';

interface UseInitiatePortabilityReturn {
  initiatePortability: (request: InitiatePortabilityRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  data: InitiatePortabilityResponse | null;
  reset: () => void;
}

export const useInitiatePortability = (): UseInitiatePortabilityReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InitiatePortabilityResponse | null>(null);

  const initiatePortability = async (request: InitiatePortabilityRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await portabilityService.initiatePortability(request);

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error?.message || 'Failed to initiate portability');
        throw new Error(response.error?.message || 'Initiation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
    setData(null);
  };

  return {
    initiatePortability,
    isLoading,
    error,
    data,
    reset,
  };
};

