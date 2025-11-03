/**
 * Notification List Component
 * Displays list of notifications with pagination
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  List,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  Button,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { DoneAll } from '@mui/icons-material';
import { useNotifications, useMarkAsRead } from '../hooks';
import { NotificationItem } from './NotificationItem';
import { Notification } from '../domain/types';

interface NotificationListProps {
  onNotificationClick?: (notification: Notification) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  onNotificationClick,
}) => {
  const { t } = useTranslation('notifications');
  const [currentPage, setCurrentPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { notifications, isLoading, error, pagination, refetch } = useNotifications(currentPage, 10, unreadOnly);
  const { markAsRead, markAllAsRead, isLoading: isMarking } = useMarkAsRead();

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    refetch(page);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      refetch(currentPage);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      refetch(currentPage);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleUnreadOnlyToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUnreadOnly(event.target.checked);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box data-testid="notification-list">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" data-testid="notification-list-title">
          {t('list.title')}
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={unreadOnly}
                onChange={handleUnreadOnlyToggle}
                data-testid="notification-filter-unread-toggle"
              />
            }
            label={t('list.filters.unreadOnly')}
          />
          <Button
            variant="outlined"
            startIcon={<DoneAll />}
            onClick={handleMarkAllAsRead}
            disabled={isMarking}
            data-testid="notification-mark-all-read-button"
          >
            {t('list.actions.markAllAsRead')}
          </Button>
        </Box>
      </Box>

      {notifications.length === 0 ? (
        <Box textAlign="center" py={8} data-testid="notification-empty-state">
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t(unreadOnly ? 'list.empty.noUnread' : 'list.empty.noNotifications')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(unreadOnly ? 'list.empty.allCaughtUp' : 'list.empty.description')}
          </Typography>
        </Box>
      ) : (
        <>
          <List data-testid="notification-items-list">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.notificationId}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onClick={onNotificationClick}
              />
            ))}
          </List>

          {pagination && pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4} data-testid="notification-pagination">
              <Pagination
                count={pagination.totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

