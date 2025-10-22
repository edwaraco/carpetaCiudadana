/**
 * Document Service Interface
 * Contract for document management operations
 */

import { ApiResponse, PaginatedResponse } from '../../../shared/utils/api.types';
import {
  Document,
  UploadDocumentRequest,
  SignDocumentRequest,
  SignDocumentResponse,
} from '../domain/types';

export interface IDocumentService {
  // Upload a document
  uploadDocument(request: UploadDocumentRequest): Promise<ApiResponse<Document>>;

  // Get all documents for current user
  getDocuments(page?: number, pageSize?: number): Promise<ApiResponse<PaginatedResponse<Document>>>;

  // Get a specific document by ID
  getDocument(documentId: string): Promise<ApiResponse<Document>>;

  // Delete a temporary document
  deleteDocument(documentId: string): Promise<ApiResponse<void>>;

  // Sign/certify a document
  signDocument(request: SignDocumentRequest): Promise<ApiResponse<SignDocumentResponse>>;

  // Download a document
  downloadDocument(documentId: string): Promise<ApiResponse<Blob>>;

  // Get presigned URL for document viewing
  getPresignedUrl(documentId: string): Promise<ApiResponse<string>>;
}

