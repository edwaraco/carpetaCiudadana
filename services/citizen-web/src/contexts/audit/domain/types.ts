/**
 * Bounded Context: Audit and Traceability
 * Domain types for access history and audit logs
 */

export interface AccessHistory {
  accessId: string;
  documentId: string;
  documentTitle: string;
  timestamp: Date;
  accessType: AccessType;
  actor: AccessActor;
  sourceIp: string;
  result: AccessResult;
  details?: string;
}

export type AccessType = 'READ' | 'DOWNLOAD' | 'SHARE' | 'UPLOAD' | 'DELETE' | 'MODIFY';

export type AccessResult = 'SUCCESS' | 'DENIED';

export interface AccessActor {
  id: string;
  name: string;
  type: ActorType;
}

export type ActorType = 'CITIZEN' | 'OFFICIAL' | 'SYSTEM';

export interface HistoryFilters {
  startDate?: Date;
  endDate?: Date;
  accessType?: AccessType;
  documentId?: string;
  result?: AccessResult;
  page?: number;
  pageSize?: number;
}

export interface AuditEvent {
  eventId: string;
  type: EventType;
  description: string;
  timestamp: Date;
  userId: string;
  metadata?: Record<string, unknown>;
  sourceIp?: string;
}

export type EventType =
  | 'CITIZEN_REGISTERED'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'MFA_VERIFIED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_SHARED'
  | 'DOCUMENT_DELETED'
  | 'AUTHORIZATION_GRANTED'
  | 'AUTHORIZATION_REVOKED'
  | 'PORTABILITY_INITIATED'
  | 'PORTABILITY_COMPLETED'
  | 'REQUEST_RECEIVED'
  | 'REQUEST_RESPONDED';

export interface AuditSummary {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  accessesByDay: AccessByDay[];
  mostAccessedDocuments: AccessedDocument[];
}

export interface AccessByDay {
  date: string;
  count: number;
}

export interface AccessedDocument {
  documentId: string;
  documentTitle: string;
  accessCount: number;
  lastAccess: Date;
}

// Domain constants
export const ACCESS_TYPE_LABELS: Record<AccessType, string> = {
  READ: 'Read',
  DOWNLOAD: 'Download',
  SHARE: 'Share',
  UPLOAD: 'Upload',
  DELETE: 'Delete',
  MODIFY: 'Modify',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  CITIZEN_REGISTERED: 'Citizen Registered',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  LOGIN_FAILED: 'Failed Login Attempt',
  MFA_VERIFIED: 'MFA Verified',
  DOCUMENT_UPLOADED: 'Document Uploaded',
  DOCUMENT_SHARED: 'Document Shared',
  DOCUMENT_DELETED: 'Document Deleted',
  AUTHORIZATION_GRANTED: 'Authorization Granted',
  AUTHORIZATION_REVOKED: 'Authorization Revoked',
  PORTABILITY_INITIATED: 'Portability Initiated',
  PORTABILITY_COMPLETED: 'Portability Completed',
  REQUEST_RECEIVED: 'Request Received',
  REQUEST_RESPONDED: 'Request Responded',
};

