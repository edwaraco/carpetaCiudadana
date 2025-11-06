/**
 * Hook for downloading documents
 * Fetches presigned URL from backend and triggers browser download
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { documentService } from '@/contexts/documents/infrastructure';
import { useCarpetaId } from '@/contexts/documents/infrastructure/carpetaContext';

interface UseDownloadDocumentReturn {
  downloadDocument: (documentId: string, titulo: string) => Promise<void>;
  isDownloading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Custom hook to download documents using presigned URLs
 *
 * Flow:
 * 1. Get presigned URL from backend (GET /carpetas/{carpetaId}/documentos/{documentId}/descargar)
 * 2. Fetch the file using the presigned MinIO URL
 * 3. Create a temporary blob URL and trigger browser download
 * 4. Clean up blob URL after download
 *
 * @returns Download function, loading state, and error handling
 *
 * @example
 * const MyComponent = () => {
 *   const { downloadDocument, isDownloading, error } = useDownloadDocument();
 *
 *   const handleDownload = async () => {
 *     await downloadDocument('doc-123', 'Mi Diploma.pdf');
 *   };
 *
 *   return (
 *     <button onClick={handleDownload} disabled={isDownloading}>
 *       {isDownloading ? 'Descargando...' : 'Descargar'}
 *     </button>
 *   );
 * };
 */
export const useDownloadDocument = (): UseDownloadDocumentReturn => {
  const { t } = useTranslation(['documents', 'common']);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const carpetaId = useCarpetaId();

  /**
   * Downloads a document by fetching presigned URL and triggering browser download
   *
   * @param documentId - UUID of the document to download
   * @param titulo - Document title to use as filename
   */
  const downloadDocument = async (documentId: string, titulo: string): Promise<void> => {
    // Check if carpetaId is available
    if (!carpetaId) {
      const errorMsg = t('errors.carpetaIdNotFound', { ns: 'documents' });
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsDownloading(true);
    setError(null);

    try {
      // Step 1: Get presigned URL from backend
      const urlResponse = await documentService.getPresignedUrl(carpetaId, documentId);

      if (!urlResponse.success || !urlResponse.data) {
        throw new Error(
          urlResponse.error?.message || t('errors.downloadFailed', { ns: 'documents' })
        );
      }

      const { urlDescarga, minutosValidez } = urlResponse.data;

      console.info(
        `Downloading document ${documentId} using presigned URL (valid for ${minutosValidez} minutes)`
      );

      // Step 2: Fetch the file from MinIO using presigned URL
      const fileResponse = await fetch(urlDescarga);

      if (!fileResponse.ok) {
        throw new Error(
          t('errors.downloadFailed', { ns: 'documents' }) + `: ${fileResponse.status} ${fileResponse.statusText}`
        );
      }

      // Step 3: Convert response to blob
      const blob = await fileResponse.blob();

      // Step 4: Create temporary blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Step 5: Create temporary anchor element and trigger download
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = titulo; // Use document title as filename
      anchor.style.display = 'none';

      // Append to DOM, click, and remove
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Step 6: Clean up blob URL after a short delay
      // (Delay ensures download starts before cleanup)
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

      console.info(`Document ${documentId} downloaded successfully as "${titulo}"`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errors.downloadFailed', { ns: 'documents' });
      console.error('Download error:', err);
      setError(errorMessage);
      throw err; // Re-throw to allow caller to handle if needed
    } finally {
      setIsDownloading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    downloadDocument,
    isDownloading,
    error,
    clearError,
  };
};

