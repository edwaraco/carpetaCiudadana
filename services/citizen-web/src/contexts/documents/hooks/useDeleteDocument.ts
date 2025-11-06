/**
 * Hook for deleting documents
 * Uses carpetaId from localStorage for delete endpoint
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { documentService } from '@/contexts/documents/infrastructure';
import { useCarpetaId } from '@/contexts/documents/infrastructure/carpetaContext';

interface UseDeleteDocumentReturn {
  deleteDocument: (documentId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useDeleteDocument = (): UseDeleteDocumentReturn => {
  const { t } = useTranslation(['documents', 'common']);
  const carpetaId = useCarpetaId();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteDocument = async (documentId: string): Promise<void> => {
    // Check if carpetaId is available
    if (!carpetaId) {
      const errorMsg = t('errors.carpetaIdNotFound', { ns: 'documents' });
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await documentService.deleteDocument(carpetaId, documentId);

      if (!response.success) {
        const errorMsg = response.error?.message || t('errors.deleteFailed', { ns: 'documents' });
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errors.generic', { ns: 'common' });
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

