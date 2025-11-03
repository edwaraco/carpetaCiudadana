/**
 * Hook for marking notifications as read
 */

import { useState } from 'react';
import { notificationService } from '../infrastructure';

export function useMarkAsRead() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAsRead = async (notificationId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await notificationService.markAsRead({ notificationId });

      if (!response.success) {
        setError(response.error?.message || 'Error al marcar como leída');
        throw new Error(response.error?.message);
      }

      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await notificationService.markAllAsRead();

      if (!response.success) {
        setError(response.error?.message || 'Error al marcar todas como leídas');
        throw new Error(response.error?.message);
      }

      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    markAsRead,
    markAllAsRead,
    isLoading,
    error,
  };
}

