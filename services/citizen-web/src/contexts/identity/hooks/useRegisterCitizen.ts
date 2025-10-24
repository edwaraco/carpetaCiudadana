/**
 * useRegisterCitizen Hook
 * Handles citizen registration logic
 */

import { useState } from 'react';
import { identityService } from '../infrastructure';
import { RegisterCitizenRequest, RegisterCitizenResponse } from '../domain/types';
import { ApiError } from '../../../shared/utils/api.types';

interface UseRegisterCitizenReturn {
  registerCitizen: (request: RegisterCitizenRequest) => Promise<void>;
  isLoading: boolean;
  error: ApiError | null;
  data: RegisterCitizenResponse | null;
  reset: () => void;
}

export const useRegisterCitizen = (): UseRegisterCitizenReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<RegisterCitizenResponse | null>(null);

  const registerCitizen = async (request: RegisterCitizenRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await identityService.registerCitizen(request);

      if (response.success && response.data) {
        setData(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError({
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        statusCode: 500,
      });
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
    registerCitizen,
    isLoading,
    error,
    data,
    reset,
  };
};

