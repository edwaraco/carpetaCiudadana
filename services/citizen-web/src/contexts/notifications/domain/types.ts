/**
 * Bounded Context: Notifications
 * Domain types for notification management
 */

export interface Notification {
  notificationId: string;
  recipientId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

export type NotificationType =
  | 'DOCUMENT_RECEIVED'
  | 'DOCUMENT_REQUESTED'
  | 'PORTABILITY_INITIATED'
  | 'PORTABILITY_COMPLETED'
  | 'REQUEST_ACCEPTED'
  | 'REQUEST_REJECTED'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'SECURITY_ALERT'
  | 'OTHER';

export type NotificationCategory =
  | 'DOCUMENT'
  | 'REQUEST'
  | 'PORTABILITY'
  | 'SECURITY'
  | 'SYSTEM';

export interface NotificationMetadata {
  documentId?: string;
  requestId?: string;
  portabilityId?: string;
  entityName?: string;
  actionUrl?: string;
  priority?: NotificationPriority;
}

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface MarkAsReadRequest {
  notificationId: string;
}

export interface MarkAllAsReadResponse {
  markedCount: number;
  message: string;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  readNotifications: number;
  byCategory: Record<NotificationCategory, number>;
  byType: Record<NotificationType, number>;
}

// Domain constants
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  DOCUMENT_RECEIVED: 'Documento Recibido',
  DOCUMENT_REQUESTED: 'Documento Solicitado',
  PORTABILITY_INITIATED: 'Portabilidad Iniciada',
  PORTABILITY_COMPLETED: 'Portabilidad Completada',
  REQUEST_ACCEPTED: 'Solicitud Aceptada',
  REQUEST_REJECTED: 'Solicitud Rechazada',
  SYSTEM_ANNOUNCEMENT: 'Anuncio del Sistema',
  SECURITY_ALERT: 'Alerta de Seguridad',
  OTHER: 'Otro',
};

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  DOCUMENT: 'Documentos',
  REQUEST: 'Solicitudes',
  PORTABILITY: 'Portabilidad',
  SECURITY: 'Seguridad',
  SYSTEM: 'Sistema',
};

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

