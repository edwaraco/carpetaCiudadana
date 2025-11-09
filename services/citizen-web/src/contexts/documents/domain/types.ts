/**
 * Bounded Context: Document Management
 * Domain types for certified and temporary documents
 */

export interface Document {
  documentId: string;
  metadata: DocumentMetadata;
  content: DocumentContent;
  certification?: DocumentCertification;
  documentStatus: DocumentStatus;
  receptionDate: Date;
}

export type DocumentStatus = 'TEMPORAL' | 'AUTENTICADO' | 'RECHAZADO';

export interface DocumentMetadata {
  title: string;
  type: DocumentType;
  context: DocumentContext;
  issueDate?: Date;
  issuingEntity?: string;
}

export type DocumentType =
  | 'CEDULA'
  | 'DIPLOMA'
  | 'GRADUATION_CERTIFICATE'
  | 'MEDICAL_CERTIFICATE'
  | 'DEED'
  | 'TAX_RETURN'
  | 'PASSPORT'
  | 'BACKGROUND_CHECK'
  | 'OTHER';

export type DocumentContext =
  | 'EDUCATION'
  | 'HEALTH'
  | 'NOTARY'
  | 'CIVIL_REGISTRY'
  | 'TAXES'
  | 'EMPLOYMENT'
  | 'IMMIGRATION'
  | 'OTHER';

export interface DocumentContent {
  format: DocumentFormat;
  sizeBytes: number;
  hash: string; // SHA-256
  storageUrl: string;
  presignedUrl?: string; // Presigned URL for viewing/download
}

export type DocumentFormat = 'PDF' | 'JPEG' | 'PNG';

export interface DocumentCertification {
  signedBy: string;
  digitalSignature: string;
  validityCertificate: string;
  signatureDate: Date;
  algorithm: string; // e.g., RSA-2048, RSA-4096
  hashAlgorithm: string; // e.g., SHA-256, SHA-512
}

export interface UploadDocumentRequest {
  file: File;
  metadata: DocumentMetadata;
}

export interface SignDocumentRequest {
  documentId: string;
  digitalCertificate?: string;
}

export interface SignDocumentResponse {
  documentId: string;
  certification: DocumentCertification;
  message: string;
}

export interface AuthenticateDocumentRequest {
  documentId: string;
  documentTitle: string;
}

export interface AuthenticateDocumentResponse {
  status: number;
  message: string;
}

// Domain constants
export const DOCUMENT_FORMAT_LABELS: Record<DocumentFormat, string> = {
  PDF: 'PDF',
  JPEG: 'JPEG Image',
  PNG: 'PNG Image',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CEDULA: 'Citizenship ID',
  DIPLOMA: 'Diploma',
  GRADUATION_CERTIFICATE: 'Graduation Certificate',
  MEDICAL_CERTIFICATE: 'Medical Certificate',
  DEED: 'Public Deed',
  TAX_RETURN: 'Tax Return',
  PASSPORT: 'Passport',
  BACKGROUND_CHECK: 'Background Check Certificate',
  OTHER: 'Other',
};

export const DOCUMENT_CONTEXT_LABELS: Record<DocumentContext, string> = {
  EDUCATION: 'Education',
  HEALTH: 'Health',
  NOTARY: 'Notary',
  CIVIL_REGISTRY: 'Civil Registry',
  TAXES: 'Taxes',
  EMPLOYMENT: 'Employment',
  IMMIGRATION: 'Immigration',
  OTHER: 'Other',
};

// ============================================================================
// Backend Integration Types
// ============================================================================

/**
 * Backend DocumentoResponse - Estructura plana del backend (Spring Boot)
 * Usado para mapear respuestas del API real
 */
export interface BackendDocumentoResponse {
  documentoId: string;
  titulo: string;
  tipoDocumento: string;
  contextoDocumento: string;
  estadoDocumento: string; // TEMPORAL, PROCESADO, CERTIFICADO, REVOCADO
  fechaRecepcion: string; // ISO 8601 LocalDateTime
  fechaUltimaModificacion: string; // ISO 8601 LocalDateTime
  esDescargable: boolean;
  formatoArchivo: string | null; // MIME type (application/pdf, image/jpeg, etc.) - may be null
  tamanoBytes: number;
  hashDocumento: string; // SHA-256 hash
}

/**
 * Backend DocumentoUrlResponse - Respuesta de URL prefirmada para descarga
 */
export interface BackendDocumentoUrlResponse {
  documentoId: string;
  titulo: string;
  urlDescarga: string; // MinIO presigned URL
  expiraEn: string; // ISO 8601 timestamp
  minutosValidez: number;
  mensaje: string;
}

/**
 * Pagination cursor for server-side pagination
 * Based on DynamoDB's LastEvaluatedKey pattern
 */
export type PaginationCursor = string | null;

/**
 * Cursor-based paginated response
 * Used for "Load More" pattern instead of page numbers
 */
export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor?: PaginationCursor;
  hasMore: boolean;
}

