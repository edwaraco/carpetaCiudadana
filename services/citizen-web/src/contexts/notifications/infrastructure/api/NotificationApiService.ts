/**
 * Real Notification Service
 * Connects to backend API
 */

import { ApiResponse, PaginatedResponse } from '@/shared/utils/api.types';
import { httpClient } from '@/shared/utils/httpClient';
import {
  Notification,
  MarkAsReadRequest,
  MarkAllAsReadResponse,
  NotificationStats,
} from '../../domain/types';
import { INotificationService } from '../INotificationService';

export class NotificationApiService implements INotificationService {
  private readonly baseUrl = '/notifications';

  async getNotifications(page = 1, pageSize = 10): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    return httpClient.get<PaginatedResponse<Notification>>(`${this.baseUrl}`, {
      params: { page, pageSize },
    });
  }

  async getUnreadNotifications(page = 1, pageSize = 10): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    return httpClient.get<PaginatedResponse<Notification>>(`${this.baseUrl}/unread`, {
      params: { page, pageSize },
    });
  }

  async getNotification(notificationId: string): Promise<ApiResponse<Notification>> {
    return httpClient.get<Notification>(`${this.baseUrl}/${notificationId}`);
  }

  async markAsRead(request: MarkAsReadRequest): Promise<ApiResponse<Notification>> {
    return httpClient.put<Notification>(`${this.baseUrl}/${request.notificationId}/read`);
  }

  async markAllAsRead(): Promise<ApiResponse<MarkAllAsReadResponse>> {
    return httpClient.put<MarkAllAsReadResponse>(`${this.baseUrl}/read-all`);
  }

  async getStats(): Promise<ApiResponse<NotificationStats>> {
    return httpClient.get<NotificationStats>(`${this.baseUrl}/stats`);
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    return httpClient.delete(`${this.baseUrl}/${notificationId}`);
  }
}

