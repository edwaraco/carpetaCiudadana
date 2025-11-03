/**
 * Hook for fetching document requests
 */

import { useState, useEffect, useCallback } from 'react';
import { requestService } from '../infrastructure';
import { DocumentRequest } from '../domain/types';

interface UseRequestsReturn {
  requests: DocumentRequest[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  } | null;
  refetch: (page?: number) => Promise<void>;
}

export const useRequests = (initialPage = 1, pageSize = 20): UseRequestsReturn => {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseRequestsReturn['pagination']>(null);

  const fetchRequests = useCallback(async (page = initialPage) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await requestService.getRequests(page, pageSize);

      if (response.success && response.data) {
        setRequests(response.data.items);
        setPagination({
          page: response.data.page,
          pageSize: response.data.pageSize,
          total: response.data.total,
          totalPages: response.data.totalPages,
          hasNext: response.data.hasNext,
          hasPrevious: response.data.hasPrevious,
        });
      } else {
        setError(response.error?.message || 'Failed to fetch requests');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [initialPage, pageSize]);
  
  useEffect(() => {
    fetchRequests(initialPage);
  }, [fetchRequests, initialPage]);

  return {
    requests,
    isLoading,
    error,
    pagination,
    refetch: fetchRequests,
  };
};

