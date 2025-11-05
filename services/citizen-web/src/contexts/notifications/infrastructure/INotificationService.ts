/**
 * Notification Service Interface
 * Contract for notification management operations
 */

import { ApiResponse, PaginatedResponse } from '@/shared/utils/api.types';
import {
  Notification,
  MarkAsReadRequest,
  MarkAllAsReadResponse,
  NotificationStats,
} from '../domain/types';

export interface INotificationService {
  // Get all notifications for current user
  getNotifications(page?: number, pageSize?: number): Promise<ApiResponse<PaginatedResponse<Notification>>>;

  // Get unread notifications only
  getUnreadNotifications(page?: number, pageSize?: number): Promise<ApiResponse<PaginatedResponse<Notification>>>;

  // Get a specific notification by ID
  getNotification(notificationId: string): Promise<ApiResponse<Notification>>;

  // Mark a notification as read
  markAsRead(request: MarkAsReadRequest): Promise<ApiResponse<Notification>>;

  // Mark all notifications as read
  markAllAsRead(): Promise<ApiResponse<MarkAllAsReadResponse>>;

  // Get notification statistics
  getStats(): Promise<ApiResponse<NotificationStats>>;

  // Delete a notification
  deleteNotification(notificationId: string): Promise<ApiResponse<void>>;
}

