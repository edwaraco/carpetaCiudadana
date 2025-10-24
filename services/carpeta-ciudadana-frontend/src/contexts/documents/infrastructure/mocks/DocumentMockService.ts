/**
 * Document Mock Service
 * Simulates document management for development/testing
 */

import { ApiResponse, PaginatedResponse } from '../../../../shared/utils/api.types';
import { IDocumentService } from '../IDocumentService';
import {
  Document,
  UploadDocumentRequest,
  SignDocumentRequest,
  SignDocumentResponse,
} from '../../domain/types';

export class DocumentMockService implements IDocumentService {
  private documents: Map<string, Document> = new Map();
  private nextId = 1;

  constructor() {
    // Pre-populate with sample documents
    this.initializeSampleDocuments();
  }

  private initializeSampleDocuments() {
    const samples: Document[] = [
      {
        documentId: 'doc-001',
        metadata: {
          title: 'Diploma de Bachillerato',
          type: 'DIPLOMA',
          context: 'EDUCATION',
          issueDate: new Date('2020-12-15'),
          tags: ['education', 'high-school'],
          issuingEntity: 'Ministerio de Educación',
        },
        content: {
          format: 'PDF',
          sizeBytes: 245600,
          hash: 'abc123hash',
          storageUrl: 'https://storage.example.com/doc-001.pdf',
        },
        certification: {
          signedBy: 'Ministerio de Educación',
          digitalSignature: 'signature-data-001',
          validityCertificate: 'cert-001',
          signatureDate: new Date('2020-12-15'),
          algorithm: 'RSA-2048',
          hashAlgorithm: 'SHA-256',
        },
        documentStatus: 'CERTIFIED',
        receptionDate: new Date('2024-01-15'),
      },
      {
        documentId: 'doc-002',
        metadata: {
          title: 'Cédula de Ciudadanía',
          type: 'CEDULA',
          context: 'CIVIL_REGISTRY',
          issueDate: new Date('2018-06-20'),
          tags: ['identity', 'citizenship'],
          issuingEntity: 'Registraduría Nacional',
        },
        content: {
          format: 'PDF',
          sizeBytes: 180000,
          hash: 'def456hash',
          storageUrl: 'https://storage.example.com/doc-002.pdf',
        },
        certification: {
          signedBy: 'Registraduría Nacional',
          digitalSignature: 'signature-data-002',
          validityCertificate: 'cert-002',
          signatureDate: new Date('2018-06-20'),
          algorithm: 'RSA-4096',
          hashAlgorithm: 'SHA-256',
        },
        documentStatus: 'CERTIFIED',
        receptionDate: new Date('2024-01-10'),
      },
      {
        documentId: 'doc-003',
        metadata: {
          title: 'Factura de Servicios',
          type: 'OTHER',
          context: 'OTHER',
          tags: ['temporary', 'utility'],
        },
        content: {
          format: 'PDF',
          sizeBytes: 95000,
          hash: 'ghi789hash',
          storageUrl: 'https://storage.example.com/doc-003.pdf',
        },
        documentStatus: 'TEMPORARY',
        receptionDate: new Date('2024-02-01'),
      },
    ];

    samples.forEach(doc => this.documents.set(doc.documentId, doc));
    this.nextId = samples.length + 1;
  }

  async uploadDocument(request: UploadDocumentRequest): Promise<ApiResponse<Document>> {
    await this.simulateDelay();

    const docId = `doc-${String(this.nextId++).padStart(3, '0')}`;

    const newDocument: Document = {
      documentId: docId,
      metadata: request.metadata,
      content: {
        format: this.getFileFormat(request.file.name),
        sizeBytes: request.file.size,
        hash: `hash-${Date.now()}`,
        storageUrl: `https://storage.example.com/${docId}.${this.getFileExtension(request.file.name)}`,
      },
      documentStatus: request.isCertified ? 'CERTIFIED' : 'TEMPORARY',
      receptionDate: new Date(),
    };

    this.documents.set(docId, newDocument);

    return {
      success: true,
      data: newDocument,
      message: 'Document uploaded successfully',
      timestamp: new Date(),
    };
  }

  async getDocuments(page = 1, pageSize = 20): Promise<ApiResponse<PaginatedResponse<Document>>> {
    await this.simulateDelay(500);

    const allDocs = Array.from(this.documents.values());
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedDocs = allDocs.slice(start, end);

    return {
      success: true,
      data: {
        items: paginatedDocs,
        total: allDocs.length,
        page,
        pageSize,
        totalPages: Math.ceil(allDocs.length / pageSize),
        hasNext: end < allDocs.length,
        hasPrevious: page > 1,
      },
      timestamp: new Date(),
    };
  }

  async getDocument(documentId: string): Promise<ApiResponse<Document>> {
    await this.simulateDelay(400);

    const document = this.documents.get(documentId);

    if (document) {
      return {
        success: true,
        data: document,
        timestamp: new Date(),
      };
    }

    return {
      success: false,
      error: {
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Document not found',
        statusCode: 404,
      },
      timestamp: new Date(),
    };
  }

  async deleteDocument(documentId: string): Promise<ApiResponse<void>> {
    await this.simulateDelay(600);

    const document = this.documents.get(documentId);

    if (!document) {
      return {
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
          statusCode: 404,
        },
        timestamp: new Date(),
      };
    }

    if (document.documentStatus === 'CERTIFIED') {
      return {
        success: false,
        error: {
          code: 'CANNOT_DELETE_CERTIFIED',
          message: 'Certified documents cannot be deleted',
          statusCode: 403,
        },
        timestamp: new Date(),
      };
    }

    this.documents.delete(documentId);

    return {
      success: true,
      message: 'Document deleted successfully',
      timestamp: new Date(),
    };
  }

  async signDocument(request: SignDocumentRequest): Promise<ApiResponse<SignDocumentResponse>> {
    await this.simulateDelay(1000);

    const document = this.documents.get(request.documentId);

    if (!document) {
      return {
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
          statusCode: 404,
        },
        timestamp: new Date(),
      };
    }

    const certification = {
      signedBy: 'Mock Digital Authority',
      digitalSignature: `signature-${Date.now()}`,
      validityCertificate: `cert-${Date.now()}`,
      signatureDate: new Date(),
      algorithm: 'RSA-2048',
      hashAlgorithm: 'SHA-256',
    };

    document.certification = certification;
    document.documentStatus = 'CERTIFIED';

    return {
      success: true,
      data: {
        documentId: document.documentId,
        certification,
        message: 'Document signed successfully',
      },
      timestamp: new Date(),
    };
  }

  async downloadDocument(documentId: string): Promise<ApiResponse<Blob>> {
    await this.simulateDelay(800);

    const document = this.documents.get(documentId);

    if (!document) {
      return {
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
          statusCode: 404,
        },
        timestamp: new Date(),
      };
    }

    // Create a mock blob
    const blob = new Blob(['Mock document content'], { type: 'application/pdf' });

    return {
      success: true,
      data: blob,
      timestamp: new Date(),
    };
  }

  async getPresignedUrl(documentId: string): Promise<ApiResponse<string>> {
    await this.simulateDelay(300);

    const document = this.documents.get(documentId);

    if (!document) {
      return {
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
          statusCode: 404,
        },
        timestamp: new Date(),
      };
    }

    // Generate mock presigned URL
    const presignedUrl = `${document.content.storageUrl}?token=mock-token-${Date.now()}&expires=3600`;

    return {
      success: true,
      data: presignedUrl,
      timestamp: new Date(),
    };
  }

  private getFileFormat(filename: string): 'PDF' | 'JPEG' | 'PNG' {
    const ext = this.getFileExtension(filename).toLowerCase();
    if (ext === 'pdf') return 'PDF';
    if (ext === 'jpg' || ext === 'jpeg') return 'JPEG';
    if (ext === 'png') return 'PNG';
    return 'PDF';
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || 'pdf';
  }

  private simulateDelay(ms: number = 600): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

