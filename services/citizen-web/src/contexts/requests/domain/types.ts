/**
 * Bounded Context: Document Requests
 * Domain types for entity document requests to citizens
 */

import { DocumentType } from '../../documents/domain/types';

export interface DocumentRequest {
  requestId: string;
  requestedCitizen: string; // Cedula
  requestingEntity: RequestingEntity;
  requiredDocuments: RequiredDocument[];
  purpose: string;
  deadline?: Date;
  notificationChannels: NotificationChannel[];
  requestStatus: RequestStatus;
  creationDate: Date;
  citizenResponse?: CitizenResponse;
}

export interface RequestingEntity {
  nit: string;
  businessName: string;
  institutionType: InstitutionType;
  sector?: string;
}

export type InstitutionType = 'PUBLIC' | 'PRIVATE' | 'MIXED';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH';

export type RequestStatus =
  | 'CREATED'
  | 'NOTIFIED'
  | 'IN_PROCESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REJECTED';

export interface RequiredDocument {
  id: string;
  documentType: DocumentType;
  specifications: string;
  mandatory: boolean;
  deliveryStatus: DeliveryStatus;
  selectedDocument?: string; // ID of document selected by citizen
}

export type DeliveryStatus = 'PENDING' | 'DELIVERED' | 'REJECTED';

export interface CitizenResponse {
  date: Date;
  action: RequestAction;
  sentDocuments?: SentDocument[];
  rejectionReason?: string;
}

export interface RespondToRequest {
  requestId: string;
  action: RequestAction;
  sentDocuments?: SentDocument[];
  rejectionReason?: string;
}

export type RequestAction = 'AUTHORIZE' | 'REJECT';

export interface SentDocument {
  requiredDocumentId: string;
  documentId: string;
}

export interface RequestProgress {
  total: number;
  completed: number;
  pending: number;
  percentage: number;
}

// Domain constants
export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  EMAIL: 'Email',
  SMS: 'Text Message',
  PUSH: 'Push Notification',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  CREATED: 'Created',
  NOTIFIED: 'Notified',
  IN_PROCESS: 'In Process',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  REJECTED: 'Rejected',
};

