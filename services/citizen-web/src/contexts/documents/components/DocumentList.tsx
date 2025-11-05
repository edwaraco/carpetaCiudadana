/**
 * Document List Component
 * Grid/list view of documents with pagination
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useDocuments, useDeleteDocument } from '@/contexts/documents/hooks';
import { DocumentCard } from '@/contexts/documents/components/DocumentCard';
import { isFeatureEnabled } from '@/shared/config/featureFlags';

interface DocumentListProps {
  onUploadClick?: () => void;
  onViewDocument?: (documentId: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  onUploadClick,
  onViewDocument,
}) => {
  const { t } = useTranslation('documents');
  const { documents, isLoading, isLoadingMore, error, hasMore, loadMore, refetch } = useDocuments();
  const { deleteDocument, isLoading: isDeleting } = useDeleteDocument();

  const canDelete = isFeatureEnabled('DELETE_DOCUMENTS');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const handleDeleteClick = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    try {
      await deleteDocument(documentToDelete);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      refetch();
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">{t('list.title')}</Typography>
        {onUploadClick && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onUploadClick}
            data-testid="upload-document-button"
          >
            {t('upload.actions.upload')}
          </Button>
        )}
      </Box>

      {documents.length === 0 ? (
        <Box textAlign="center" py={8} data-testid="empty-state">
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('list.empty')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {t('list.emptyDescription')}
          </Typography>
          {onUploadClick && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onUploadClick}
              data-testid="upload-document-button-empty"
            >
              {t('upload.actions.upload')}
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {documents.map((document) => (
              <Grid item xs={12} sm={6} md={4} key={document.documentId}>
                <DocumentCard
                  document={document}
                  onView={onViewDocument}
                  onDelete={canDelete ? handleDeleteClick : undefined}
                />
              </Grid>
            ))}
          </Grid>

          {hasMore && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Button
                variant="outlined"
                onClick={loadMore}
                disabled={isLoadingMore}
                size="large"
                data-testid="load-more-button"
              >
                {isLoadingMore ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    {t('list.loading')}
                  </>
                ) : (
                  t('list.loadMore')
                )}
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} data-testid="delete-dialog">
        <DialogTitle>{t('detail.actions.delete')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('delete.confirm')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDeleteCancel}
            disabled={isDeleting}
            data-testid="delete-cancel-button"
          >
            {t('upload.actions.cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={isDeleting}
            autoFocus
            data-testid="delete-confirm-button"
          >
            {t('detail.actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

