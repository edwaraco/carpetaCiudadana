/**
 * Download Document Button Component
 * Self-contained download button with feature flag control
 *
 * This component:
 * - Checks DOWNLOAD_DOCUMENTS feature flag internally
 * - Returns null if feature is disabled (doesn't render)
 * - Manages download state and errors independently
 * - Can be used in DocumentCard, DocumentList, or any other component
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, CircularProgress, Tooltip, Alert, Box } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useDownloadDocument } from '@/contexts/documents/hooks/useDownloadDocument';
import { isFeatureEnabled } from '@/shared/config/featureFlags';

interface DownloadDocumentButtonProps {
  documentId: string;
  documentTitle: string;
  size?: 'small' | 'medium' | 'large';
  showError?: boolean; // Whether to show inline error alert
}

export const DownloadDocumentButton: React.FC<DownloadDocumentButtonProps> = ({
  documentId,
  documentTitle,
  size = 'small',
  showError = false,
}) => {
  const { t } = useTranslation('documents');
  const { downloadDocument, isDownloading, error, clearError } = useDownloadDocument();

  // Feature flag check - don't render if disabled
  if (!isFeatureEnabled('DOWNLOAD_DOCUMENTS')) {
    return null;
  }

  const handleDownload = async () => {
    try {
      await downloadDocument(documentId, documentTitle);
    } catch (err) {
      // Error is already set in the hook
      console.error('Failed to download document:', err);
    }
  };

  return (
    <>
      {showError && error && (
        <Box mb={1}>
          <Alert severity="error" onClose={clearError}>
            {error}
          </Alert>
        </Box>
      )}

      <Tooltip title={isDownloading ? t('detail.actions.downloading') : t('detail.actions.download')}>
        <span>
          <IconButton
            size={size}
            onClick={handleDownload}
            disabled={isDownloading}
            aria-label={`${t('detail.actions.download')} ${documentTitle}`}
          >
            {isDownloading ? (
              <CircularProgress size={size === 'small' ? 20 : size === 'medium' ? 24 : 28} />
            ) : (
              <DownloadIcon />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
};

