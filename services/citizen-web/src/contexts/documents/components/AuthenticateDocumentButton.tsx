/**
 * Authenticate Document Button Component
 * Button to trigger document authentication with Gov Carpeta service
 */

import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { VerifiedUser as AuthenticateIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { AuthenticateDocumentDialog } from '@/contexts/documents/components/AuthenticateDocumentDialog';

interface AuthenticateDocumentButtonProps {
  documentId: string;
  documentTitle: string;
  size?: 'small' | 'medium' | 'large';
}

export const AuthenticateDocumentButton: React.FC<AuthenticateDocumentButtonProps> = ({
  documentId,
  documentTitle,
  size = 'medium',
}) => {
  const { t } = useTranslation('documents');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Tooltip title={t('authenticate.tooltip')}>
        <IconButton
          size={size}
          onClick={handleOpenDialog}
          color="primary"
          data-testid={`authenticate-document-${documentId}`}
        >
          <AuthenticateIcon />
        </IconButton>
      </Tooltip>

      <AuthenticateDocumentDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        documentId={documentId}
        documentTitle={documentTitle}
      />
    </>
  );
};

