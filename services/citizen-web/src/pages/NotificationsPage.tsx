/**
 * Notifications Page
 * Main page for notification management
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { NotificationList } from '../contexts/notifications/components';
import { Notification } from '../contexts/notifications/domain/types';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    // Navigate to the action URL if available
    if (notification.metadata?.actionUrl) {
      navigate(notification.metadata.actionUrl);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box>
        <NotificationList onNotificationClick={handleNotificationClick} />
      </Box>
    </Container>
  );
};

