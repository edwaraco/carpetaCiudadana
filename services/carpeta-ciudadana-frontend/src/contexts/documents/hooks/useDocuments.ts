/**
 * Hook for fetching documents
 */

import { useState, useEffect } from 'react';
import { documentService } from '../infrastructure';
import { Document } from '../domain/types';
import { PaginatedResponse } from '../../../shared/utils/api.types';

interface UseDocumentsReturn {
  documents: Document[];
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

export const useDocuments = (initialPage = 1, pageSize = 20): UseDocumentsReturn => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseDocumentsReturn['pagination']>(null);

  const fetchDocuments = async (page = initialPage) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await documentService.getDocuments(page, pageSize);

      if (response.success && response.data) {
        setDocuments(response.data.items);
        setPagination({
          page: response.data.page,
          pageSize: response.data.pageSize,
          total: response.data.total,
          totalPages: response.data.totalPages,
          hasNext: response.data.hasNext,
          hasPrevious: response.data.hasPrevious,
        });
      } else {
        setError(response.error?.message || 'Failed to fetch documents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(initialPage);
  }, [initialPage]);

  return {
    documents,
    isLoading,
    error,
    pagination,
    refetch: fetchDocuments,
  };
};

