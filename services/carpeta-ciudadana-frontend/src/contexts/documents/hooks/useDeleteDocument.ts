/**
 * Hook for deleting documents
 */

import { useState } from 'react';
import { documentService } from '../infrastructure';

interface UseDeleteDocumentReturn {
  deleteDocument: (documentId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useDeleteDocument = (): UseDeleteDocumentReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteDocument = async (documentId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await documentService.deleteDocument(documentId);

      if (!response.success) {
        setError(response.error?.message || 'Failed to delete document');
        throw new Error(response.error?.message || 'Delete failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteDocument,
    isLoading,
    error,
  };
};

