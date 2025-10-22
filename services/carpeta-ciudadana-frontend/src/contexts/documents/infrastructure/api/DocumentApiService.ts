/**
 * Document API Service - Real Implementation
 */

import { httpClient } from '../../../../shared/utils/httpClient';
import { ApiResponse, PaginatedResponse } from '../../../../shared/utils/api.types';
import { IDocumentService } from '../IDocumentService';
import {
  Document,
  UploadDocumentRequest,
  SignDocumentRequest,
  SignDocumentResponse,
} from '../../domain/types';

export class DocumentApiService implements IDocumentService {
  async uploadDocument(request: UploadDocumentRequest): Promise<ApiResponse<Document>> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('metadata', JSON.stringify(request.metadata));
    formData.append('isCertified', String(request.isCertified || false));

    return httpClient.post<Document>('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getDocuments(page = 1, pageSize = 20): Promise<ApiResponse<PaginatedResponse<Document>>> {
    return httpClient.get<PaginatedResponse<Document>>('/documents', {
      params: { page, pageSize },
    });
  }

  async getDocument(documentId: string): Promise<ApiResponse<Document>> {
    return httpClient.get<Document>(`/documents/${documentId}`);
  }

  async deleteDocument(documentId: string): Promise<ApiResponse<void>> {
    return httpClient.delete<void>(`/documents/${documentId}`);
  }

  async signDocument(request: SignDocumentRequest): Promise<ApiResponse<SignDocumentResponse>> {
    return httpClient.post<SignDocumentResponse>('/documents/sign', request);
  }

  async downloadDocument(documentId: string): Promise<ApiResponse<Blob>> {
    const response = await httpClient.get<Blob>(`/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response as any;
  }

  async getPresignedUrl(documentId: string): Promise<ApiResponse<string>> {
    return httpClient.get<string>(`/documents/${documentId}/presigned-url`);
  }
}

