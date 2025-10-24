/**
 * Hook for fetching notifications
 */

import { useState, useEffect } from 'react';
import { Notification } from '../domain/types';
import { notificationService } from '../infrastructure';
import { PaginatedResponse } from '@/shared/utils/api.types';

export function useNotifications(page = 1, pageSize = 10, unreadOnly = false) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<Notification>['pagination'] | null>(null);

  const fetchNotifications = async (currentPage: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = unreadOnly
        ? await notificationService.getUnreadNotifications(currentPage, pageSize)
        : await notificationService.getNotifications(currentPage, pageSize);

      if (response.success && response.data) {
        setNotifications(response.data.items);
        setPagination(response.data.pagination);
      } else {
        setError(response.error?.message || 'Error al cargar notificaciones');
      }
    } catch (err) {
      setError('Error inesperado al cargar notificaciones');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page);
  }, [page, pageSize, unreadOnly]);

  const refetch = (newPage?: number) => {
    fetchNotifications(newPage || page);
  };

  return {
    notifications,
    isLoading,
    error,
    pagination,
    refetch,
  };
}

