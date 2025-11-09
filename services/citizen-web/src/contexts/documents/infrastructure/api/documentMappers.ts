/**
 * Document Mappers
 * Bidirectional mapping between backend (Spring Boot) and frontend (React) document models
 *
 * Backend: Flat structure with Spanish vocabulary (DocumentoResponse)
 * Frontend: Nested structure with English vocabulary (Document)
 */

import type {
  Document,
  DocumentType,
  DocumentContext,
  DocumentStatus,
  DocumentFormat,
  BackendDocumentoResponse,
} from '@/contexts/documents/domain/types';

// ============================================================================
// Type Mapping Dictionaries
// ============================================================================

/**
 * Document Type mapping: Frontend → Backend
 */
const TYPE_MAP_FE_TO_BE: Record<DocumentType, string> = {
  CEDULA: 'CEDULA',
  DIPLOMA: 'DIPLOMA',
  GRADUATION_CERTIFICATE: 'ACTA_GRADO',
  MEDICAL_CERTIFICATE: 'PROCESADO_MEDICO',
  DEED: 'DEED',
  TAX_RETURN: 'TAX_RETURN',
  PASSPORT: 'PASSPORT',
  BACKGROUND_CHECK: 'PROCESADO_LABORAL',
  OTHER: 'OTHER',
};

/**
 * Document Type mapping: Backend → Frontend
 */
const TYPE_MAP_BE_TO_FE: Record<string, DocumentType> = {
  CEDULA: 'CEDULA',
  DIPLOMA: 'DIPLOMA',
  ACTA_GRADO: 'GRADUATION_CERTIFICATE',
  PROCESADO_MEDICO: 'MEDICAL_CERTIFICATE',
  DEED: 'DEED',
  TAX_RETURN: 'TAX_RETURN',
  PASSPORT: 'PASSPORT',
  PROCESADO_LABORAL: 'BACKGROUND_CHECK',
  OTHER: 'OTHER',
};

/**
 * Document Context mapping: Frontend → Backend
 */
const CONTEXT_MAP_FE_TO_BE: Record<DocumentContext, string> = {
  EDUCATION: 'EDUCACION',
  HEALTH: 'SALUD',
  NOTARY: 'NOTARIA',
  CIVIL_REGISTRY: 'REGISTRADURIA',
  TAXES: 'TAXES',
  EMPLOYMENT: 'LABORAL',
  IMMIGRATION: 'IMMIGRATION',
  OTHER: 'OTHER',
};

/**
 * Document Context mapping: Backend → Frontend
 */
const CONTEXT_MAP_BE_TO_FE: Record<string, DocumentContext> = {
  EDUCACION: 'EDUCATION',
  SALUD: 'HEALTH',
  NOTARIA: 'NOTARY',
  REGISTRADURIA: 'CIVIL_REGISTRY',
  TAXES: 'TAXES',
  LABORAL: 'EMPLOYMENT',
  IMMIGRATION: 'IMMIGRATION',
  OTHER: 'OTHER',
};

/**
 * Document Status mapping: Backend → Frontend
 */
const STATUS_MAP_BE_TO_FE: Record<string, DocumentStatus> = {
  TEMPORAL: 'TEMPORAL',
  EN_AUTENTICACION: 'TEMPORAL', // Documents being authenticated are still shown as temporal
  AUTENTICADO: 'AUTENTICADO', // Authenticated documents
  RECHAZADO: 'RECHAZADO', // Rejected documents
};

// ============================================================================
// Individual Mapper Functions
// ============================================================================

/**
 * Maps backend document type (Spanish) to frontend type (English)
 * @param backendType - Backend document type (e.g., "ACTA_GRADO")
 * @returns Frontend document type (e.g., "GRADUATION_CERTIFICATE")
 * @fallback Returns 'OTHER' if type is unknown
 */
export const mapBackendToFrontendType = (backendType: string): DocumentType => {
  const mappedType = TYPE_MAP_BE_TO_FE[backendType];
  if (!mappedType) {
    console.warn(`Unknown backend document type: ${backendType}. Falling back to OTHER.`);
    return 'OTHER';
  }
  return mappedType;
};

/**
 * Maps frontend document type (English) to backend type (Spanish)
 * @param frontendType - Frontend document type
 * @returns Backend document type
 */
export const mapFrontendToBackendType = (frontendType: DocumentType): string => {
  return TYPE_MAP_FE_TO_BE[frontendType];
};

/**
 * Maps backend document context (Spanish) to frontend context (English)
 * @param backendContext - Backend context (e.g., "EDUCACION")
 * @returns Frontend context (e.g., "EDUCATION")
 * @fallback Returns 'OTHER' if context is unknown
 */
export const mapBackendToFrontendContext = (backendContext: string): DocumentContext => {
  const mappedContext = CONTEXT_MAP_BE_TO_FE[backendContext];
  if (!mappedContext) {
    console.warn(`Unknown backend document context: ${backendContext}. Falling back to OTHER.`);
    return 'OTHER';
  }
  return mappedContext;
};

/**
 * Maps frontend document context (English) to backend context (Spanish)
 * @param frontendContext - Frontend context
 * @returns Backend context
 */
export const mapFrontendToBackendContext = (frontendContext: DocumentContext): string => {
  return CONTEXT_MAP_FE_TO_BE[frontendContext];
};

/**
 * Maps backend document status (Spanish) to frontend status (English)
 * @param backendStatus - Backend status (e.g., "TEMPORAL", "PROCESADO")
 * @returns Frontend status (e.g., "TEMPORARY", "AUTENTICADO")
 * @fallback Returns 'TEMPORARY' if status is unknown
 */
export const mapBackendToFrontendStatus = (backendStatus: string): DocumentStatus => {
  const mappedStatus = STATUS_MAP_BE_TO_FE[backendStatus];
  if (!mappedStatus) {
    console.warn(`Unknown backend document status: ${backendStatus}. Falling back to TEMPORAL.`);
    return 'TEMPORAL';
  }
  return mappedStatus;
};

/**
 * Converts MIME type to document format
 * @param mimeType - MIME type from backend (e.g., "application/pdf")
 * @returns Document format (e.g., "PDF")
 * @fallback Returns 'PDF' if MIME type is unknown, null, or undefined
 */
export const mapMimeTypeToFormat = (mimeType: string | null | undefined): DocumentFormat => {
  if (!mimeType) {
    console.warn('MIME type is null or undefined. Falling back to PDF.');
    return 'PDF';
  }

  const normalized = mimeType.toLowerCase();

  if (normalized === 'application/pdf') return 'PDF';
  if (normalized === 'image/jpeg' || normalized === 'image/jpg') return 'JPEG';
  if (normalized === 'image/png') return 'PNG';

  console.warn(`Unknown MIME type: ${mimeType}. Falling back to PDF.`);
  return 'PDF';
};

/**
 * Converts document format to MIME type
 * @param format - Document format (e.g., "PDF")
 * @returns MIME type (e.g., "application/pdf")
 */
export const mapFormatToMimeType = (format: DocumentFormat): string => {
  switch (format) {
    case 'PDF':
      return 'application/pdf';
    case 'JPEG':
      return 'image/jpeg';
    case 'PNG':
      return 'image/png';
    default:
      return 'application/pdf';
  }
};

/**
 * Parses ISO 8601 date string from backend
 * @param isoDateString - ISO 8601 date string (e.g., "2025-11-01T10:00:00")
 * @returns Date object
 * @fallback Returns current date if parsing fails
 */
const parseBackendDate = (isoDateString: string): Date => {
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date format: ${isoDateString}. Using current date.`);
      return new Date();
    }
    return date;
  } catch (error) {
    console.error(`Error parsing date: ${isoDateString}`, error);
    return new Date();
  }
};

// ============================================================================
// Main Mapping Functions
// ============================================================================

/**
 * Maps backend DocumentoResponse to frontend Document
 * Converts flat Spanish structure to nested English structure
 *
 * @param backend - Backend DocumentoResponse from API
 * @returns Frontend Document model
 *
 * @example
 * const backendDoc = {
 *   documentoId: "123",
 *   titulo: "Diploma",
 *   tipoDocumento: "ACTA_GRADO",
 *   // ...
 * };
 * const frontendDoc = backendToFrontendDocument(backendDoc);
 * // frontendDoc.metadata.type === "GRADUATION_CERTIFICATE"
 */
export const backendToFrontendDocument = (backend: BackendDocumentoResponse): Document => {
  return {
    documentId: backend.documentoId,
    metadata: {
      title: backend.titulo,
      type: mapBackendToFrontendType(backend.tipoDocumento),
      context: mapBackendToFrontendContext(backend.contextoDocumento),
      issueDate: undefined, // Backend doesn't track issue date separately
      issuingEntity: undefined, // Backend doesn't include issuing entity in response
    },
    content: {
      format: mapMimeTypeToFormat(backend.formatoArchivo),
      sizeBytes: backend.tamanoBytes,
      hash: backend.hashDocumento,
      storageUrl: '', // Backend doesn't expose direct storage URL
      presignedUrl: undefined, // Will be fetched separately when needed
    },
    certification: undefined, // Backend doesn't include certification details in list response
    documentStatus: mapBackendToFrontendStatus(backend.estadoDocumento),
    receptionDate: parseBackendDate(backend.fechaRecepcion),
  };
};

/**
 * Prepares FormData for document upload to backend
 * Converts frontend metadata to backend @RequestParam format
 *
 * Backend expects:
 * - archivo: MultipartFile
 * - titulo: String
 * - tipoDocumento: String (CEDULA, DIPLOMA, ACTA_GRADO, etc.)
 * - contextoDocumento: String (EDUCACION, NOTARIA, REGISTRADURIA, etc.)
 *
 * @param file - File to upload
 * @param titulo - Document title
 * @param tipo - Frontend document type (will be mapped to backend enum)
 * @param contexto - Frontend document context (will be mapped to backend enum)
 * @returns FormData ready for multipart/form-data POST with @RequestParam fields
 *
 * @example
 * const formData = frontendToBackendUploadRequest(
 *   file,
 *   "Mi Diploma",
 *   "GRADUATION_CERTIFICATE",
 *   "EDUCATION"
 * );
 * // FormData contains:
 * // - archivo: File
 * // - titulo: "Mi Diploma"
 * // - tipoDocumento: "ACTA_GRADO"
 * // - contextoDocumento: "EDUCACION"
 */
export const frontendToBackendUploadRequest = (
  file: File,
  titulo: string,
  tipo: DocumentType,
  contexto: DocumentContext
): FormData => {
  const formData = new FormData();

  // Append file with backend field name (@RequestParam("archivo"))
  formData.append('archivo', file);

  // Append metadata as flat @RequestParam fields
  formData.append('titulo', titulo);
  formData.append('tipoDocumento', mapFrontendToBackendType(tipo));
  formData.append('contextoDocumento', mapFrontendToBackendContext(contexto));

  return formData;
};

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if an object is a valid BackendDocumentoResponse
 * Uses functional paradigm with every() for maintainability
 */
export const isBackendDocumentoResponse = (obj: unknown): obj is BackendDocumentoResponse => {
  if (typeof obj !== 'object' || obj === null) return false;

  const doc = obj as Record<string, unknown>;

  // Fields that must be strings
  const stringFields: (keyof BackendDocumentoResponse)[] = [
    'documentoId',
    'titulo',
    'tipoDocumento',
    'contextoDocumento',
    'estadoDocumento',
    'fechaRecepcion',
    'fechaUltimaModificacion',
    'formatoArchivo',
    'hashDocumento',
  ];

  // Fields that must be numbers
  const numberFields: (keyof BackendDocumentoResponse)[] = ['tamanoBytes'];

  // Fields that must be booleans
  const booleanFields: (keyof BackendDocumentoResponse)[] = ['esDescargable'];

  // Validate all fields using functional approach
  const hasValidStrings = stringFields.every((field) => typeof doc[field] === 'string');
  const hasValidNumbers = numberFields.every((field) => typeof doc[field] === 'number');
  const hasValidBooleans = booleanFields.every((field) => typeof doc[field] === 'boolean');

  // Log first invalid field for debugging
  if (!hasValidStrings) {
    const invalidField = stringFields.find((field) => typeof doc[field] !== 'string');
    console.warn(`Invalid BackendDocumentoResponse: field '${invalidField}' must be string`);
  }
  if (!hasValidNumbers) {
    const invalidField = numberFields.find((field) => typeof doc[field] !== 'number');
    console.warn(`Invalid BackendDocumentoResponse: field '${invalidField}' must be number`);
  }
  if (!hasValidBooleans) {
    const invalidField = booleanFields.find((field) => typeof doc[field] !== 'boolean');
    console.warn(`Invalid BackendDocumentoResponse: field '${invalidField}' must be boolean`);
  }

  return hasValidStrings && hasValidNumbers && hasValidBooleans;
};

