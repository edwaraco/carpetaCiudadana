/**
 * Hook for responding to document requests
 */

import { useState } from 'react';
import { requestService } from '../infrastructure';
import { RespondToRequest } from '../domain/types';

interface UseRespondToRequestReturn {
  respondToRequest: (request: RespondToRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

export const useRespondToRequest = (): UseRespondToRequestReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const respondToRequest = async (request: RespondToRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await requestService.respondToRequest(request);

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error?.message || 'Failed to respond to request');
        throw new Error(response.error?.message || 'Response failed');
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
    setSuccess(false);
  };

  return {
    respondToRequest,
    isLoading,
    error,
    success,
    reset,
  };
};

