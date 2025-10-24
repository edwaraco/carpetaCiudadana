/**
 * useValidateCitizen Hook
 * Validates if a citizen with given cedula exists
 */

import { useState } from 'react';
import { identityService } from '../infrastructure';
import { ValidateCitizenResponse } from '../domain/types';
import { ApiError } from '../../../shared/utils/api.types';

interface UseValidateCitizenReturn {
  validateCitizen: (cedula: string) => Promise<ValidateCitizenResponse | null>;
  isLoading: boolean;
  error: ApiError | null;
  data: ValidateCitizenResponse | null;
  reset: () => void;
}

export const useValidateCitizen = (): UseValidateCitizenReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<ValidateCitizenResponse | null>(null);

  const validateCitizen = async (cedula: string): Promise<ValidateCitizenResponse | null> => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await identityService.validateCitizen({ cedula });

      if (response.success && response.data) {
        setData(response.data);
        return response.data;
      } else if (response.error) {
        setError(response.error);
        return null;
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

    return null;
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
    setData(null);
  };

  return {
    validateCitizen,
    isLoading,
    error,
    data,
    reset,
  };
};

