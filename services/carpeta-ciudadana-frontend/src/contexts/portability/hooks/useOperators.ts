/**
 * Hook for fetching available operators
 */

import { useState, useEffect } from 'react';
import { portabilityService } from '../infrastructure';
import { Operator } from '../domain/types';

interface UseOperatorsReturn {
  operators: Operator[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useOperators = (): UseOperatorsReturn => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOperators = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await portabilityService.getOperators();

      if (response.success && response.data) {
        setOperators(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch operators');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  return {
    operators,
    isLoading,
    error,
    refetch: fetchOperators,
  };
};

