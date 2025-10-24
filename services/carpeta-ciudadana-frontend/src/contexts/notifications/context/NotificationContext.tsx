/**
 * Notification Context
 * Global state for notification badge counter
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { notificationService } from '../infrastructure';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUnreadCount = async () => {
    try {
      setIsLoading(true);
      const response = await notificationService.getStats();
      if (response.success && response.data) {
        setUnreadCount(response.data.unreadNotifications);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUnreadCount();
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, isLoading }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

