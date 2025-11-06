/**
 * Hook for uploading documents
 * Uses carpetaId from localStorage for upload endpoint
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { documentService } from '@/contexts/documents/infrastructure';
import { Document, UploadDocumentRequest } from '@/contexts/documents/domain/types';
import { useCarpetaId } from '@/contexts/documents/infrastructure/carpetaContext';

interface UseUploadDocumentReturn {
  uploadDocument: (request: UploadDocumentRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  data: Document | null;
  reset: () => void;
}

export const useUploadDocument = (): UseUploadDocumentReturn => {
  const { t } = useTranslation(['documents', 'common']);
  const carpetaId = useCarpetaId();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Document | null>(null);

  const uploadDocument = async (request: UploadDocumentRequest): Promise<void> => {
    // Check if carpetaId is available
    if (!carpetaId) {
      const errorMsg = t('errors.carpetaIdNotFound', { ns: 'documents' });
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await documentService.uploadDocument(carpetaId, request);

      if (response.success && response.data) {
        setData(response.data);
      } else {
        const errorMsg = response.error?.message || t('upload.errors.uploadFailed', { ns: 'documents' });
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

  const reset = () => {
    setIsLoading(false);
    setError(null);
    setData(null);
  };

  return {
    uploadDocument,
    isLoading,
    error,
    data,
    reset,
  };
};

