/**
 * Mock Notification Service
 * For development and testing
 */

import { ApiResponse, PaginatedResponse } from '@/shared/utils/api.types';
import {
  Notification,
  MarkAsReadRequest,
  MarkAllAsReadResponse,
  NotificationStats,
  NotificationType,
  NotificationCategory,
} from '../../domain/types';
import { INotificationService } from '../INotificationService';

// Mock data
const mockNotifications: Notification[] = [
  {
    notificationId: 'notif-1',
    recipientId: 'user-123',
    type: 'DOCUMENT_RECEIVED',
    category: 'DOCUMENT',
    title: 'Documento Recibido',
    message: 'Has recibido un nuevo documento certificado: Diploma de grado',
    metadata: {
      documentId: 'doc-123',
      entityName: 'Universidad Nacional',
      priority: 'HIGH',
      actionUrl: '/documents',
    },
    isRead: false,
    createdAt: new Date('2025-10-24T10:30:00'),
  },
  {
    notificationId: 'notif-2',
    recipientId: 'user-123',
    type: 'DOCUMENT_REQUESTED',
    category: 'REQUEST',
    title: 'Nueva Solicitud de Documento',
    message: 'La empresa TechCorp ha solicitado tu certificado de antecedentes',
    metadata: {
      requestId: 'req-456',
      entityName: 'TechCorp',
      priority: 'MEDIUM',
      actionUrl: '/requests',
    },
    isRead: false,
    createdAt: new Date('2025-10-24T09:15:00'),
  },
  {
    notificationId: 'notif-3',
    recipientId: 'user-123',
    type: 'REQUEST_ACCEPTED',
    category: 'REQUEST',
    title: 'Solicitud Aceptada',
    message: 'Tu solicitud de documento ha sido aceptada por el ciudadano',
    metadata: {
      requestId: 'req-789',
      priority: 'LOW',
    },
    isRead: true,
    createdAt: new Date('2025-10-23T16:45:00'),
    readAt: new Date('2025-10-23T17:00:00'),
  },
  {
    notificationId: 'notif-4',
    recipientId: 'user-123',
    type: 'SECURITY_ALERT',
    category: 'SECURITY',
    title: 'Alerta de Seguridad',
    message: 'Se detectó un inicio de sesión desde un nuevo dispositivo',
    metadata: {
      priority: 'URGENT',
    },
    isRead: true,
    createdAt: new Date('2025-10-22T14:20:00'),
    readAt: new Date('2025-10-22T14:25:00'),
  },
  {
    notificationId: 'notif-5',
    recipientId: 'user-123',
    type: 'SYSTEM_ANNOUNCEMENT',
    category: 'SYSTEM',
    title: 'Mantenimiento Programado',
    message: 'El sistema estará en mantenimiento el próximo domingo de 2am a 6am',
    metadata: {
      priority: 'LOW',
    },
    isRead: true,
    createdAt: new Date('2025-10-21T10:00:00'),
    readAt: new Date('2025-10-21T11:30:00'),
  },
  {
    notificationId: 'notif-6',
    recipientId: 'user-123',
    type: 'PORTABILITY_INITIATED',
    category: 'PORTABILITY',
    title: 'Portabilidad Iniciada',
    message: 'Tu proceso de cambio de operador ha sido iniciado exitosamente',
    metadata: {
      portabilityId: 'port-123',
      priority: 'HIGH',
      actionUrl: '/portability',
    },
    isRead: false,
    createdAt: new Date('2025-10-24T08:00:00'),
  },
];

export class NotificationMockService implements INotificationService {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async getNotifications(page = 1, pageSize = 10): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    await this.delay(500);

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const notifications = [...mockNotifications].slice(start, end);

    return {
      success: true,
      data: {
        items: notifications,
        pagination: {
          currentPage: page,
          pageSize,
          totalItems: mockNotifications.length,
          totalPages: Math.ceil(mockNotifications.length / pageSize),
        },
      },
    };
  }

  async getUnreadNotifications(page = 1, pageSize = 10): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    await this.delay(400);

    const unread = mockNotifications.filter(n => !n.isRead);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const notifications = unread.slice(start, end);

    return {
      success: true,
      data: {
        items: notifications,
        pagination: {
          currentPage: page,
          pageSize,
          totalItems: unread.length,
          totalPages: Math.ceil(unread.length / pageSize),
        },
      },
    };
  }

  async getNotification(notificationId: string): Promise<ApiResponse<Notification>> {
    await this.delay(300);

    const notification = mockNotifications.find(n => n.notificationId === notificationId);

    if (!notification) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notificación no encontrada',
        },
      };
    }

    return {
      success: true,
      data: notification,
    };
  }

  async markAsRead(request: MarkAsReadRequest): Promise<ApiResponse<Notification>> {
    await this.delay(300);

    const notification = mockNotifications.find(n => n.notificationId === request.notificationId);

    if (!notification) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notificación no encontrada',
        },
      };
    }

    notification.isRead = true;
    notification.readAt = new Date();

    return {
      success: true,
      data: notification,
    };
  }

  async markAllAsRead(): Promise<ApiResponse<MarkAllAsReadResponse>> {
    await this.delay(500);

    let count = 0;
    mockNotifications.forEach(notification => {
      if (!notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date();
        count++;
      }
    });

    return {
      success: true,
      data: {
        markedCount: count,
        message: `${count} notificaciones marcadas como leídas`,
      },
    };
  }

  async getStats(): Promise<ApiResponse<NotificationStats>> {
    await this.delay(300);

    const total = mockNotifications.length;
    const unread = mockNotifications.filter(n => !n.isRead).length;
    const read = total - unread;

    const byCategory: Record<NotificationCategory, number> = {
      DOCUMENT: 0,
      REQUEST: 0,
      PORTABILITY: 0,
      SECURITY: 0,
      SYSTEM: 0,
    };

    const byType: Record<NotificationType, number> = {
      DOCUMENT_RECEIVED: 0,
      DOCUMENT_REQUESTED: 0,
      PORTABILITY_INITIATED: 0,
      PORTABILITY_COMPLETED: 0,
      REQUEST_ACCEPTED: 0,
      REQUEST_REJECTED: 0,
      SYSTEM_ANNOUNCEMENT: 0,
      SECURITY_ALERT: 0,
      OTHER: 0,
    };

    mockNotifications.forEach(notification => {
      byCategory[notification.category]++;
      byType[notification.type]++;
    });

    return {
      success: true,
      data: {
        totalNotifications: total,
        unreadNotifications: unread,
        readNotifications: read,
        byCategory,
        byType,
      },
    };
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    await this.delay(300);

    const index = mockNotifications.findIndex(n => n.notificationId === notificationId);

    if (index === -1) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notificación no encontrada',
        },
      };
    }

    mockNotifications.splice(index, 1);

    return {
      success: true,
      data: undefined,
    };
  }
}

