/**
 * Hook for uploading documents
 */

import { useState } from 'react';
import { documentService } from '../infrastructure';
import { Document, UploadDocumentRequest } from '../domain/types';

interface UseUploadDocumentReturn {
  uploadDocument: (request: UploadDocumentRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  data: Document | null;
  reset: () => void;
}

export const useUploadDocument = (): UseUploadDocumentReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Document | null>(null);

  const uploadDocument = async (request: UploadDocumentRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await documentService.uploadDocument(request);

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

