/**
 * Document API Service - Real Implementation
 * Connects to Spring Boot backend at /api/v1${this.basePath}/carpetas/{carpetaId}/documentos
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
  AuthenticateDocumentRequest,
  AuthenticateDocumentResponse,
} from '@/contexts/documents/domain/types';
import {
  backendToFrontendDocument,
  frontendToBackendUploadRequest,
} from '@/contexts/documents/infrastructure/api/documentMappers';

export class DocumentApiService implements IDocumentService {
  basePath: string = '/documents'
  /**
   * Upload a document to the backend
   * POST ${this.basePath}/carpetas/{carpetaId}/documentos
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
        `${this.basePath}/carpetas/${carpetaId}/documentos`,
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
   * GET ${this.basePath}/carpetas/{carpetaId}/documentos?cursor={cursor}
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
        `${this.basePath}/carpetas/${carpetaId}/documentos`,
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
   * GET ${this.basePath}/carpetas/{carpetaId}/documentos/{documentId}
   */
  async getDocument(carpetaId: string, documentId: string): Promise<ApiResponse<Document>> {
    try {
      const response = await httpClient.get<BackendDocumentoResponse>(
        `${this.basePath}/carpetas/${carpetaId}/documentos/${documentId}`
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
   * DELETE ${this.basePath}/carpetas/{carpetaId}/documentos/{documentId}
   */
  async deleteDocument(carpetaId: string, documentId: string): Promise<ApiResponse<void>> {
    try {
      return await httpClient.delete<void>(`${this.basePath}/carpetas/${carpetaId}/documentos/${documentId}`);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Sign/certify a document (future functionality)
   * POST ${this.basePath}/carpetas/{carpetaId}/documentos/{documentId}/sign
   */
  async signDocument(
    carpetaId: string,
    request: SignDocumentRequest
  ): Promise<ApiResponse<SignDocumentResponse>> {
    try {
      return await httpClient.post<SignDocumentResponse>(
        `${this.basePath}/carpetas/${carpetaId}/documentos/${request.documentId}/sign`,
        request
      );
    } catch (error) {
      console.error('Error signing document:', error);
      throw error;
    }
  }

  /**
   * Get presigned URL for document download
   * GET ${this.basePath}/carpetas/{carpetaId}/documentos/{documentId}/descargar
   */
  async getPresignedUrl(
    carpetaId: string,
    documentId: string
  ): Promise<ApiResponse<BackendDocumentoUrlResponse>> {
    try {
      return await httpClient.get<BackendDocumentoUrlResponse>(
        `${this.basePath}/carpetas/${carpetaId}/documentos/${documentId}/descargar`
      );
    } catch (error) {
      console.error('Error fetching presigned URL:', error);
      throw error;
    }
  }

  /**
   * Authenticate a document with Gov Carpeta service
   * POST /api/v1/authentication/authenticateDocument
   * Proxied through nginx to document-authentication-service
   * Note: carpetaId is not needed - authentication uses JWT token from httpClient
   */
  async authenticateDocument(
    request: AuthenticateDocumentRequest
  ): Promise<ApiResponse<AuthenticateDocumentResponse>> {
    try {
      // httpClient baseURL is /api (or /api/v1)
      // This calls: baseURL + /v1/authentication/authenticateDocument
      const backendResponse = await httpClient.post<AuthenticateDocumentResponse>(
        '/authentication/authenticateDocument',
        request
      );

      // Backend returns: { status: 202, message: "Accepted" }
      // httpClient.post returns this object directly (not wrapped in ApiResponse)
      const apiData = backendResponse as unknown as AuthenticateDocumentResponse;

      // Return properly formatted ApiResponse
      return {
        success: apiData.status === 202,
        data: apiData,
        message: apiData.message,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error authenticating document:', error);
      throw error;
    }
  }
}

