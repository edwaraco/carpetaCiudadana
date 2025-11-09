/**
 * Authenticate Document Dialog Component
 * Confirmation dialog for document authentication
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { documentService } from '@/contexts/documents/infrastructure';

interface AuthenticateDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

export const AuthenticateDocumentDialog: React.FC<AuthenticateDocumentDialogProps> = ({
  open,
  onClose,
  documentId,
  documentTitle,
}) => {
  const { t } = useTranslation('documents');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleConfirm = async () => {
    setIsAuthenticating(true);

    try {
      const response = await documentService.authenticateDocument({
        documentId,
        documentTitle,
      });

      if (response.success) {
        console.log('Document authentication request accepted:', response.data);
        setSnackbar({
          open: true,
          message: t('authenticate.success'),
          severity: 'success',
        });
        onClose();
      } else {
        const errorMessage = response.error?.message || 'Authentication request failed';
        console.error('Authentication error:', errorMessage);
        setSnackbar({
          open: true,
          message: t('authenticate.error', { error: errorMessage }),
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error authenticating document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSnackbar({
        open: true,
        message: t('authenticate.error', { error: errorMessage }),
        severity: 'error',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="authenticate-dialog-title"
        aria-describedby="authenticate-dialog-description"
      >
        <DialogTitle id="authenticate-dialog-title">{t('authenticate.dialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText id="authenticate-dialog-description">
            {t('authenticate.dialog.message', { documentTitle })}
          </DialogContentText>
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('authenticate.dialog.info')}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={isAuthenticating}>
            {t('authenticate.dialog.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            autoFocus
            disabled={isAuthenticating}
            startIcon={isAuthenticating ? <CircularProgress size={20} /> : undefined}
          >
            {isAuthenticating ? t('authenticate.dialog.authenticating') : t('authenticate.dialog.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

