/**
 * Notification Item Component
 * Single notification display
 */

import React from 'react';
import {
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Typography,
  Box,
} from '@mui/material';
import {
  Notifications,
  CheckCircle,
  Info,
  Warning,
  Delete,
} from '@mui/icons-material';
import { Notification, NotificationCategory } from '../domain/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  onClick?: (notification: Notification) => void;
}

const CATEGORY_ICONS: Record<NotificationCategory, React.ReactNode> = {
  DOCUMENT: <Notifications />,
  REQUEST: <Info />,
  PORTABILITY: <CheckCircle />,
  SECURITY: <Warning />,
  SYSTEM: <Info />,
};

const PRIORITY_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'error',
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}) => {
  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.notificationId);
    }
    if (onClick) {
      onClick(notification);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <ListItem
      data-testid={`notification-item-${notification.notificationId}`}
      data-read={notification.isRead}
      sx={{
        bgcolor: notification.isRead ? 'transparent' : 'action.hover',
        borderLeft: notification.isRead ? 'none' : '4px solid',
        borderColor: notification.isRead ? 'transparent' : 'primary.main',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          bgcolor: 'action.selected',
        },
      }}
      secondaryAction={
        onDelete && (
          <IconButton
            edge="end"
            onClick={() => onDelete(notification.notificationId)}
            data-testid={`notification-delete-${notification.notificationId}`}
          >
            <Delete />
          </IconButton>
        )
      }
      onClick={handleClick}
    >
      <ListItemIcon>{CATEGORY_ICONS[notification.category]}</ListItemIcon>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" fontWeight={notification.isRead ? 'normal' : 'bold'}>
              {notification.title}
            </Typography>
            {notification.metadata?.priority && (
              <Chip
                label={notification.metadata.priority}
                size="small"
                color={PRIORITY_COLORS[notification.metadata.priority]}
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              {notification.message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {timeAgo}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );
};

