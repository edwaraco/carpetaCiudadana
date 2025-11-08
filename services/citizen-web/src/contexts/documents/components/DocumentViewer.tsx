/**
 * Document Viewer Component
 * Displays document content with certification status and metadata
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Divider,
  Alert,
  AlertTitle,
  Grid,
  type AlertColor,
} from '@mui/material';
import {
  VerifiedUser as CertifiedIcon,
  Schedule as TemporaryIcon,
  Block as RevokedIcon,
  InsertDriveFile as FileIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { Document, DocumentStatus } from '@/contexts/documents/domain/types';
import { useTranslation } from 'react-i18next';

interface DocumentViewerProps {
  document: Document;
}

interface StatusAlertConfig {
  severity: AlertColor;
  icon: React.ReactElement;
  titleKey: string;
  messageKey: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ document }) => {
  const { t } = useTranslation('documents');

  // Status configuration map
  const statusAlertConfig: Record<DocumentStatus, StatusAlertConfig> = {
    CERTIFIED: {
      severity: 'success',
      icon: <CertifiedIcon />,
      titleKey: 'viewer.certifiedTitle',
      messageKey: 'viewer.certifiedMessage',
    },
    TEMPORARY: {
      severity: 'warning',
      icon: <TemporaryIcon />,
      titleKey: 'viewer.temporaryTitle',
      messageKey: 'viewer.temporaryMessage',
    },
    REVOKED: {
      severity: 'error',
      icon: <RevokedIcon />,
      titleKey: 'viewer.revokedTitle',
      messageKey: 'viewer.revokedMessage',
    },
  };

  const statusIconMap: Record<DocumentStatus, React.ReactElement> = {
    CERTIFIED: <CertifiedIcon />,
    TEMPORARY: <TemporaryIcon />,
    REVOKED: <RevokedIcon />,
  };

  const statusColorMap: Record<DocumentStatus, 'success' | 'warning' | 'error'> = {
    CERTIFIED: 'success',
    TEMPORARY: 'warning',
    REVOKED: 'error',
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentStatusConfig = statusAlertConfig[document.documentStatus];

  // Helper function to get translated status messages
  const getStatusMessage = (status: DocumentStatus) => {
    switch (status) {
      case 'CERTIFIED':
        return {
          title: t('viewer.certifiedTitle'),
          message: t('viewer.certifiedMessage'),
        };
      case 'TEMPORARY':
        return {
          title: t('viewer.temporaryTitle'),
          message: t('viewer.temporaryMessage'),
        };
      case 'REVOKED':
        return {
          title: t('viewer.revokedTitle'),
          message: t('viewer.revokedMessage'),
        };
    }
  };

  const statusMessage = getStatusMessage(document.documentStatus);

  return (
    <Box>
      {/* Status Alert - Rendered from configuration map */}
      <Alert
        severity={currentStatusConfig.severity}
        icon={currentStatusConfig.icon}
        sx={{ mb: 3 }}
      >
        <AlertTitle>{statusMessage.title}</AlertTitle>
        {statusMessage.message}
      </Alert>

      {/* Document Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <FileIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box flexGrow={1}>
              <Typography variant="h5" component="h1" gutterBottom>
                {document.metadata.title}
              </Typography>
              <Chip
                label={document.documentStatus}
                color={statusColorMap[document.documentStatus]}
                size="small"
                icon={statusIconMap[document.documentStatus]}
              />
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Metadata Grid */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CategoryIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('viewer.type')}:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {document.metadata.type}
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CategoryIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('viewer.context')}:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {document.metadata.context}
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('viewer.receptionDate')}:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatDate(document.receptionDate)}
                </Typography>
              </Stack>
            </Grid>

            {document.metadata.issueDate && (
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {t('viewer.issueDate')}:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatDate(document.metadata.issueDate)}
                  </Typography>
                </Stack>
              </Grid>
            )}

            {document.metadata.issuingEntity && (
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <BusinessIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {t('viewer.issuingEntity')}:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {document.metadata.issuingEntity}
                  </Typography>
                </Stack>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <FileIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('viewer.format')}:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {document.content.format}
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <FileIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('viewer.size')}:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatBytes(document.content.sizeBytes)}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Document Preview/Embed Area */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('viewer.preview')}
          </Typography>
          <Divider sx={{ my: 2 }} />

          {document.content.presignedUrl && (
            <Box
              sx={{
                width: '100%',
                minHeight: '600px',
                backgroundColor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              {document.content.format === 'PDF' ? (
                <iframe
                  src={document.content.presignedUrl}
                  title={document.metadata.title}
                  width="100%"
                  height="600px"
                  style={{ border: 'none' }}
                />
              ) : (
                <img
                  src={document.content.presignedUrl}
                  alt={document.metadata.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '600px',
                    objectFit: 'contain',
                  }}
                />
              )}
            </Box>
          )}

          {!document.content.presignedUrl && (
            <Alert severity="info">
              {t('viewer.noPreview')}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

