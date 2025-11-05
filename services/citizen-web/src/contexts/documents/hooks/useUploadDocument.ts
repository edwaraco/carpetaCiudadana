/**
 * Hook for uploading documents
 * Uses carpetaId from localStorage for upload endpoint
 */

import { useState } from 'react';
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
  const carpetaId = useCarpetaId();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Document | null>(null);

  const uploadDocument = async (request: UploadDocumentRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await documentService.uploadDocument(carpetaId, request);

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error?.message || 'Failed to upload document');
        throw new Error(response.error?.message || 'Upload failed');
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

