/**
 * Document Service Interface
 * Contract for document management operations
 */

import type { ApiResponse } from '@/shared/utils/api.types';
import type {
  Document,
  UploadDocumentRequest,
  SignDocumentRequest,
  SignDocumentResponse,
  CursorPaginatedResponse,
  BackendDocumentoUrlResponse,
  PaginationCursor,
  AuthenticateDocumentRequest,
  AuthenticateDocumentResponse,
} from '@/contexts/documents/domain/types';

export interface IDocumentService {
  /**
   * Upload a document to a specific carpeta
   * @param carpetaId - UUID of the carpeta (folder)
   * @param request - Upload request containing file and metadata
   * @returns Uploaded document with backend-generated ID
   */
  uploadDocument(carpetaId: string, request: UploadDocumentRequest): Promise<ApiResponse<Document>>;

  /**
   * Get documents for a specific carpeta with cursor-based pagination
   * @param carpetaId - UUID of the carpeta (folder)
   * @param cursor - Optional pagination cursor from previous response
   * @returns Paginated list of documents with nextCursor for "Load More"
   */
  getDocuments(
    carpetaId: string,
    cursor?: PaginationCursor
  ): Promise<ApiResponse<CursorPaginatedResponse<Document>>>;

  /**
   * Get a specific document by ID
   * @param carpetaId - UUID of the carpeta (folder)
   * @param documentId - UUID of the document
   * @returns Document with full metadata
   */
  getDocument(carpetaId: string, documentId: string): Promise<ApiResponse<Document>>;

  /**
   * Delete a document (only temporary documents can be deleted)
   * @param carpetaId - UUID of the carpeta (folder)
   * @param documentId - UUID of the document to delete
   * @returns Void on success
   */
  deleteDocument(carpetaId: string, documentId: string): Promise<ApiResponse<void>>;

  /**
   * Sign/certify a document (future functionality)
   * @param carpetaId - UUID of the carpeta (folder)
   * @param request - Signing request with document ID and certificate
   * @returns Signed document response with certification details
   */
  signDocument(
    carpetaId: string,
    request: SignDocumentRequest
  ): Promise<ApiResponse<SignDocumentResponse>>;

  /**
   * Get presigned URL for document download
   * @param carpetaId - UUID of the carpeta (folder)
   * @param documentId - UUID of the document
   * @returns Backend response with presigned MinIO URL and expiration info
   */
  getPresignedUrl(
    carpetaId: string,
    documentId: string
  ): Promise<ApiResponse<BackendDocumentoUrlResponse>>;

  /**
   * Authenticate a document with Gov Carpeta service
   * @param request - Authentication request with document ID and title
   * @returns Authentication response with status code and message
   * Note: carpetaId is not needed - authentication uses JWT token
   */
  authenticateDocument(
    request: AuthenticateDocumentRequest
  ): Promise<ApiResponse<AuthenticateDocumentResponse>>;
}

