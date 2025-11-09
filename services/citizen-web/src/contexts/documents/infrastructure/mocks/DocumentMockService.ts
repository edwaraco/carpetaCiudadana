/**
 * Document Mock Service
 * Simulates document management for development/testing
 */

import type { ApiResponse } from '@/shared/utils/api.types';
import type { IDocumentService } from '@/contexts/documents/infrastructure/IDocumentService';
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
        documentStatus: 'AUTENTICADO',
        receptionDate: new Date('2024-01-15'),
      },
      {
        documentId: 'doc-002',
        metadata: {
          title: 'Cédula de Ciudadanía',
          type: 'CEDULA',
          context: 'CIVIL_REGISTRY',
          issueDate: new Date('2018-06-20'),
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
        documentStatus: 'AUTENTICADO',
        receptionDate: new Date('2024-01-10'),
      },
      {
        documentId: 'doc-003',
        metadata: {
          title: 'Factura de Servicios',
          type: 'OTHER',
          context: 'OTHER',
        },
        content: {
          format: 'PDF',
          sizeBytes: 95000,
          hash: 'ghi789hash',
          storageUrl: 'https://storage.example.com/doc-003.pdf',
        },
        documentStatus: 'TEMPORAL',
        receptionDate: new Date('2024-02-01'),
      },
    ];

    samples.forEach(doc => this.documents.set(doc.documentId, doc));
    this.nextId = samples.length + 1;
  }

  async uploadDocument(
    carpetaId: string,
    request: UploadDocumentRequest
  ): Promise<ApiResponse<Document>> {
    await this.simulateDelay();

    console.log(`[Mock] Uploading document to carpeta: ${carpetaId}`);

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
      documentStatus: 'TEMPORAL',
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

  async getDocuments(
    carpetaId: string,
    cursor?: PaginationCursor
  ): Promise<ApiResponse<CursorPaginatedResponse<Document>>> {
    await this.simulateDelay(500);

    console.log(`[Mock] Getting documents for carpeta: ${carpetaId}, cursor: ${cursor}`);

    const allDocs = Array.from(this.documents.values()).sort(
      (a, b) => b.receptionDate.getTime() - a.receptionDate.getTime()
    );

    const pageSize = 20;
    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const endIndex = startIndex + pageSize;
    const paginatedDocs = allDocs.slice(startIndex, endIndex);

    const hasMore = endIndex < allDocs.length;
    const nextCursor = hasMore ? String(endIndex) : undefined;

    return {
      success: true,
      data: {
        items: paginatedDocs,
        nextCursor,
        hasMore,
      },
      timestamp: new Date(),
    };
  }

  async getDocument(carpetaId: string, documentId: string): Promise<ApiResponse<Document>> {
    await this.simulateDelay(400);

    console.log(`[Mock] Getting document ${documentId} from carpeta: ${carpetaId}`);

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

  async deleteDocument(carpetaId: string, documentId: string): Promise<ApiResponse<void>> {
    await this.simulateDelay(600);

    console.log(`[Mock] Deleting document ${documentId} from carpeta: ${carpetaId}`);

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

    if (document.documentStatus === 'AUTENTICADO') {
      return {
        success: false,
        error: {
          code: 'CANNOT_DELETE_AUTENTICADO',
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

  async signDocument(
    carpetaId: string,
    request: SignDocumentRequest
  ): Promise<ApiResponse<SignDocumentResponse>> {
    await this.simulateDelay(1000);

    console.log(`[Mock] Signing document ${request.documentId} in carpeta: ${carpetaId}`);

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
    document.documentStatus = 'AUTENTICADO';

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

  async getPresignedUrl(
    carpetaId: string,
    documentId: string
  ): Promise<ApiResponse<BackendDocumentoUrlResponse>> {
    await this.simulateDelay(300);

    console.log(`[Mock] Getting presigned URL for document ${documentId} in carpeta: ${carpetaId}`);

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

    // Generate mock presigned URL response matching backend format
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    const mockResponse: BackendDocumentoUrlResponse = {
      documentoId: documentId,
      titulo: document.metadata.title,
      urlDescarga: `${document.content.storageUrl}?token=mock-token-${Date.now()}&expires=900`,
      expiraEn: expirationTime.toISOString(),
      minutosValidez: 15,
      mensaje: 'URL de descarga generada exitosamente',
    };

    return {
      success: true,
      data: mockResponse,
      timestamp: new Date(),
    };
  }

  async authenticateDocument(
    request: AuthenticateDocumentRequest
  ): Promise<ApiResponse<AuthenticateDocumentResponse>> {
    await this.simulateDelay(800);

    console.log(
      `[Mock] Authenticating document ${request.documentId} (${request.documentTitle})`
    );

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

    // Simulate successful authentication response (202 Accepted)
    return {
      success: true,
      data: {
        status: 202,
        message: 'Accepted',
      },
      message: 'Document authentication request accepted',
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

