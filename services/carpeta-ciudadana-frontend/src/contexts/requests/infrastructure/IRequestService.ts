/**
 * Request Service Interface
 * Contract for document request operations
 */

import { ApiResponse, PaginatedResponse } from '../../../shared/utils/api.types';
import { DocumentRequest, RespondToRequest } from '../domain/types';

export interface IRequestService {
  // Get all document requests for the citizen
  getRequests(page?: number, pageSize?: number): Promise<ApiResponse<PaginatedResponse<DocumentRequest>>>;

  // Get a specific request by ID
  getRequest(requestId: string): Promise<ApiResponse<DocumentRequest>>;

  // Respond to a document request (authorize or reject)
  respondToRequest(request: RespondToRequest): Promise<ApiResponse<void>>;
}

