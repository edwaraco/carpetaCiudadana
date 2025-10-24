/**
 * Hook for fetching notification statistics
 */

import { useState, useEffect } from 'react';
import { NotificationStats } from '../domain/types';
import { notificationService } from '../infrastructure';

export function useNotificationStats() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await notificationService.getStats();

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar estadísticas');
      }
    } catch (err) {
      setError('Error inesperado al cargar estadísticas');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const refetch = () => {
    fetchStats();
  };

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}

