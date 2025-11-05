/**
 * Hook for fetching documents with cursor-based pagination
 *
 * Uses "Load More" pattern instead of traditional page numbers:
 * - Initial load fetches first batch of documents
 * - loadMore() appends next batch to existing documents
 * - refetch() clears and fetches from beginning
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { documentService } from '@/contexts/documents/infrastructure';
import { Document, PaginationCursor } from '@/contexts/documents/domain/types';
import { useCarpetaId } from '@/contexts/documents/infrastructure/carpetaContext';

interface UseDocumentsReturn {
  documents: Document[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const useDocuments = (): UseDocumentsReturn => {
  const { t } = useTranslation(['documents', 'common']);
  const carpetaId = useCarpetaId();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<PaginationCursor>(null);
  const [hasMore, setHasMore] = useState(false);

  /**
   * Fetches documents from the beginning (no cursor)
   * Used for initial load and refetch operations
   */
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // useCarpetaId() will throw if carpetaId is not available
      const response = await documentService.getDocuments(carpetaId);

      if (response.success && response.data) {
        setDocuments(response.data.items);
        setNextCursor(response.data.nextCursor ?? null);
        setHasMore(response.data.hasMore);
      } else {
        setError(response.error?.message || t('errors.fetchFailed', { ns: 'documents' }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic', { ns: 'common' }));
    } finally {
      setIsLoading(false);
    }
  }, [carpetaId, t]);

  /**
   * Loads more documents using the current cursor
   * Appends results to existing documents array
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore) {
      return;
    }

    // If carpetaId is not available, set error
    if (!carpetaId) {
      setError(t('errors.carpetaIdNotFound', { ns: 'documents' }));
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const response = await documentService.getDocuments(carpetaId, nextCursor);

      if (response.success && response.data) {
        const { items, nextCursor: cursor, hasMore: more } = response.data;
        setDocuments((prev) => [...prev, ...items]);
        setNextCursor(cursor ?? null);
        setHasMore(more);
      } else {
        setError(response.error?.message || t('errors.fetchFailed', { ns: 'documents' }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic', { ns: 'common' }));
    } finally {
      setIsLoadingMore(false);
    }
  }, [carpetaId, nextCursor, hasMore, isLoadingMore, t]);

  /**
   * Refetches documents from the beginning
   * Clears existing documents and resets cursor
   */
  const refetch = useCallback(async () => {
    await fetchDocuments();
  }, [fetchDocuments]);

  // Initial load on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
  };
};

