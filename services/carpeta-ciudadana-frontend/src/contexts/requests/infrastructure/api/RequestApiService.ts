/**
 * Request API Service - Real Implementation
 */

import { httpClient } from '../../../../shared/utils/httpClient';
import { ApiResponse, PaginatedResponse } from '../../../../shared/utils/api.types';
import { IRequestService } from '../IRequestService';
import { DocumentRequest, RespondToRequest } from '../../domain/types';

export class RequestApiService implements IRequestService {
  async getRequests(
    page = 1,
    pageSize = 20
  ): Promise<ApiResponse<PaginatedResponse<DocumentRequest>>> {
    return httpClient.get<PaginatedResponse<DocumentRequest>>('/requests', {
      params: { page, pageSize },
    });
  }

  async getRequest(requestId: string): Promise<ApiResponse<DocumentRequest>> {
    return httpClient.get<DocumentRequest>(`/requests/${requestId}`);
  }

  async respondToRequest(request: RespondToRequest): Promise<ApiResponse<void>> {
    return httpClient.post<void>(`/requests/${request.requestId}/respond`, request);
  }
}

