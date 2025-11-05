/**
 * Document API Service - Real Implementation
 * Connects to Spring Boot backend at /api/v1/carpetas/{carpetaId}/documentos
 */

import { httpClient } from '@/shared/utils/httpClient';
import type { ApiResponse } from '@/shared/utils/api.types';
import type { IDocumentService } from '@/contexts/documents/infrastructure/IDocumentService';
import type {
  Document,
  UploadDocumentRequest,
  SignDocumentRequest,
  SignDocumentResponse,
  CursorPaginatedResponse,
  BackendDocumentoResponse,
  BackendDocumentoUrlResponse,
  PaginationCursor,
} from '@/contexts/documents/domain/types';
import {
  backendToFrontendDocument,
  frontendToBackendUploadRequest,
} from '@/contexts/documents/infrastructure/api/documentMappers';

export class DocumentApiService implements IDocumentService {
  /**
   * Upload a document to the backend
   * POST /carpetas/{carpetaId}/documentos
   */
  async uploadDocument(carpetaId: string, request: UploadDocumentRequest): Promise<ApiResponse<Document>> {
    try {
      // Convert frontend request to backend FormData with @RequestParam fields
      const formData = frontendToBackendUploadRequest(
        request.file,
        request.metadata.title,
        request.metadata.type,
        request.metadata.context
      );

      // Call backend endpoint
      const response = await httpClient.post<BackendDocumentoResponse>(
        `/carpetas/${carpetaId}/documentos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.success && response.data) {
        return {
          ...response,
          data: backendToFrontendDocument(response.data),
        };
      }

      throw new Error('Failed to upload document: No data received from backend');
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Get documents with cursor-based pagination
   * GET /carpetas/{carpetaId}/documentos?cursor={cursor}
   *
   * Backend returns: ApiResponse<DocumentosPaginadosResponse>
   * Where DocumentosPaginadosResponse = { items: DocumentoResponse[], nextCursor: string | null, hasMore: boolean }
   */
  async getDocuments(
    carpetaId: string,
    cursor?: PaginationCursor
  ): Promise<ApiResponse<CursorPaginatedResponse<Document>>> {
    try {
      const params = cursor ? { cursor } : {};

      const response = await httpClient.get<CursorPaginatedResponse<BackendDocumentoResponse>>(
        `/carpetas/${carpetaId}/documentos`,
        { params }
      );

      if (response.success && response.data) {
        const { items, nextCursor, hasMore } = response.data;
        return {
          success: response.success,
          message: response.message,
          data: {
            items: items.map(backendToFrontendDocument),
            nextCursor,
            hasMore,
          },
        };
      }

      throw new Error('Failed to fetch documents: No data received from backend');
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  /**
   * Get a single document by ID
   * GET /carpetas/{carpetaId}/documentos/{documentId}
   */
  async getDocument(carpetaId: string, documentId: string): Promise<ApiResponse<Document>> {
    try {
      const response = await httpClient.get<BackendDocumentoResponse>(
        `/carpetas/${carpetaId}/documentos/${documentId}`
      );

      if (response.success && response.data) {
        return {
          ...response,
          data: backendToFrontendDocument(response.data),
        };
      }

      throw new Error('Failed to fetch document: No data received from backend');
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   * DELETE /carpetas/{carpetaId}/documentos/{documentId}
   */
  async deleteDocument(carpetaId: string, documentId: string): Promise<ApiResponse<void>> {
    try {
      return await httpClient.delete<void>(`/carpetas/${carpetaId}/documentos/${documentId}`);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Sign/certify a document (future functionality)
   * POST /carpetas/{carpetaId}/documentos/{documentId}/sign
   */
  async signDocument(
    carpetaId: string,
    request: SignDocumentRequest
  ): Promise<ApiResponse<SignDocumentResponse>> {
    try {
      return await httpClient.post<SignDocumentResponse>(
        `/carpetas/${carpetaId}/documentos/${request.documentId}/sign`,
        request
      );
    } catch (error) {
      console.error('Error signing document:', error);
      throw error;
    }
  }

  /**
   * Get presigned URL for document download
   * GET /carpetas/{carpetaId}/documentos/{documentId}/descargar
   */
  async getPresignedUrl(
    carpetaId: string,
    documentId: string
  ): Promise<ApiResponse<BackendDocumentoUrlResponse>> {
    try {
      return await httpClient.get<BackendDocumentoUrlResponse>(
        `/carpetas/${carpetaId}/documentos/${documentId}/descargar`
      );
    } catch (error) {
      console.error('Error fetching presigned URL:', error);
      throw error;
    }
  }
}

