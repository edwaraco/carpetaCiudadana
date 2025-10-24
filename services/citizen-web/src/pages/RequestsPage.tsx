/**
 * Requests Page
 * Main page for document request management
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Typography } from '@mui/material';
import { RequestList, RespondRequestDialog } from '../contexts/requests/components';

export const RequestsPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRespond = (requestId: string) => {
    setSelectedRequestId(requestId);
    setRespondDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setRespondDialogOpen(false);
    setSelectedRequestId(null);
  };

  const handleResponseSuccess = () => {
    setRefreshKey((prev) => prev + 1); // Force refresh of request list
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('requestsPage.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {t('requestsPage.subtitle')}
        </Typography>

        <RequestList
          key={refreshKey}
          onViewDetails={(requestId) => console.log('View details:', requestId)}
          onRespond={handleRespond}
        />

        <RespondRequestDialog
          open={respondDialogOpen}
          requestId={selectedRequestId}
          onClose={handleCloseDialog}
          onSuccess={handleResponseSuccess}
        />
    </Container>
  );
};

