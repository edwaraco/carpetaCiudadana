/**
 * Request Mock Service
 * Simulates document request operations for development/testing
 */

import { ApiResponse, PaginatedResponse } from '../../../../shared/utils/api.types';
import { IRequestService } from '../IRequestService';
import { DocumentRequest, RespondToRequest, RequestStatus } from '../../domain/types';

export class RequestMockService implements IRequestService {
  private mockRequests: DocumentRequest[] = [
    {
      requestId: 'req-001',
      requestedCitizen: '1234567890',
      requestingEntity: {
        nit: '900123456-7',
        businessName: 'Universidad Nacional de Colombia',
        institutionType: 'PUBLIC',
        sector: 'Education',
      },
      requiredDocuments: [
        {
          id: 'doc-req-001',
          documentType: 'DIPLOMA',
          specifications: 'High School Diploma',
          mandatory: true,
          deliveryStatus: 'PENDING',
        },
        {
          id: 'doc-req-002',
          documentType: 'CEDULA',
          specifications: 'Colombian National ID',
          mandatory: true,
          deliveryStatus: 'PENDING',
        },
      ],
      purpose: 'University admission process',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notificationChannels: ['EMAIL', 'PUSH'],
      requestStatus: 'NOTIFIED',
      creationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      requestId: 'req-002',
      requestedCitizen: '1234567890',
      requestingEntity: {
        nit: '800654321-2',
        businessName: 'Banco de la República',
        institutionType: 'PUBLIC',
        sector: 'Financial',
      },
      requiredDocuments: [
        {
          id: 'doc-req-003',
          documentType: 'TAX_DOCUMENT',
          specifications: 'RUT - Tax Registration',
          mandatory: true,
          deliveryStatus: 'PENDING',
        },
        {
          id: 'doc-req-004',
          documentType: 'CEDULA',
          specifications: 'Colombian National ID',
          mandatory: true,
          deliveryStatus: 'PENDING',
        },
      ],
      purpose: 'Bank account opening',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      notificationChannels: ['EMAIL', 'SMS'],
      requestStatus: 'CREATED',
      creationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      requestId: 'req-003',
      requestedCitizen: '1234567890',
      requestingEntity: {
        nit: '700987654-1',
        businessName: 'MinSalud',
        institutionType: 'PUBLIC',
        sector: 'Health',
      },
      requiredDocuments: [
        {
          id: 'doc-req-005',
          documentType: 'MEDICAL_RECORD',
          specifications: 'Vaccination record',
          mandatory: false,
          deliveryStatus: 'DELIVERED',
          selectedDocument: 'doc-001',
        },
      ],
      purpose: 'Health system registration',
      notificationChannels: ['EMAIL'],
      requestStatus: 'COMPLETED',
      creationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      citizenResponse: {
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        action: 'AUTHORIZE',
        sentDocuments: [
          {
            requiredDocumentId: 'doc-req-005',
            documentId: 'doc-001',
          },
        ],
      },
    },
  ];

  async getRequests(
    page = 1,
    pageSize = 20
  ): Promise<ApiResponse<PaginatedResponse<DocumentRequest>>> {
    await this.simulateDelay();

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = this.mockRequests.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        items: paginatedItems,
        page,
        pageSize,
        total: this.mockRequests.length,
        totalPages: Math.ceil(this.mockRequests.length / pageSize),
        hasNext: endIndex < this.mockRequests.length,
        hasPrevious: page > 1,
      },
      timestamp: new Date(),
    };
  }

  async getRequest(requestId: string): Promise<ApiResponse<DocumentRequest>> {
    await this.simulateDelay(400);

    const request = this.mockRequests.find((req) => req.requestId === requestId);

    if (!request) {
      return {
        success: false,
        error: {
          code: 'REQUEST_NOT_FOUND',
          message: 'Document request not found',
          statusCode: 404,
        },
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      data: request,
      timestamp: new Date(),
    };
  }

  async respondToRequest(request: RespondToRequest): Promise<ApiResponse<void>> {
    await this.simulateDelay(800);

    const requestIndex = this.mockRequests.findIndex(
      (req) => req.requestId === request.requestId
    );

    if (requestIndex === -1) {
      return {
        success: false,
        error: {
          code: 'REQUEST_NOT_FOUND',
          message: 'Document request not found',
          statusCode: 404,
        },
        timestamp: new Date(),
      };
    }

    const documentRequest = this.mockRequests[requestIndex];

    // Check if request is already completed or rejected
    if (['COMPLETED', 'REJECTED', 'EXPIRED', 'CANCELLED'].includes(documentRequest.requestStatus)) {
      return {
        success: false,
        error: {
          code: 'REQUEST_ALREADY_PROCESSED',
          message: `Cannot respond to a ${documentRequest.requestStatus.toLowerCase()} request`,
          statusCode: 400,
        },
        timestamp: new Date(),
      };
    }

    // Update request status
    const newStatus: RequestStatus = request.action === 'AUTHORIZE' ? 'COMPLETED' : 'REJECTED';

    // Update the request
    this.mockRequests[requestIndex] = {
      ...documentRequest,
      requestStatus: newStatus,
      citizenResponse: {
        date: new Date(),
        action: request.action,
        sentDocuments: request.sentDocuments,
        rejectionReason: request.rejectionReason,
      },
    };

    // Update delivery status for sent documents
    if (request.sentDocuments) {
      request.sentDocuments.forEach((sentDoc) => {
        const docIndex = this.mockRequests[requestIndex].requiredDocuments.findIndex(
          (rd) => rd.id === sentDoc.requiredDocumentId
        );
        if (docIndex !== -1) {
          this.mockRequests[requestIndex].requiredDocuments[docIndex].deliveryStatus = 'DELIVERED';
          this.mockRequests[requestIndex].requiredDocuments[docIndex].selectedDocument =
            sentDoc.documentId;
        }
      });
    }

    return {
      success: true,
      message: `Request ${newStatus.toLowerCase()} successfully`,
      timestamp: new Date(),
    };
  }

  private simulateDelay(ms: number = 600): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

