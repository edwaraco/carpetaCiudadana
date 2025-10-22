/**
 * Document List Component
 * Grid/list view of documents with pagination
 */

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useDocuments, useDeleteDocument } from '../hooks';
import { DocumentCard } from './DocumentCard';
import { documentService } from '../infrastructure';

interface DocumentListProps {
  onUploadClick?: () => void;
  onViewDocument?: (documentId: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  onUploadClick,
  onViewDocument,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { documents, isLoading, error, pagination, refetch } = useDocuments(currentPage);
  const { deleteDocument, isLoading: isDeleting } = useDeleteDocument();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    refetch(page);
  };

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
      refetch(currentPage);
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const handleDownload = async (documentId: string) => {
    try {
      const response = await documentService.downloadDocument(documentId);
      if (response.success && response.data) {
        // Create a blob URL and trigger download
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `document-${documentId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
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
        <Typography variant="h5">My Documents</Typography>
        {onUploadClick && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={onUploadClick}>
            Upload Document
          </Button>
        )}
      </Box>

      {documents.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No documents yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Upload your first document to get started
          </Typography>
          {onUploadClick && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={onUploadClick}>
              Upload Document
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
                  onDownload={handleDownload}
                  onDelete={handleDeleteClick}
                />
              </Grid>
            ))}
          </Grid>

          {pagination && pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this document? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={isDeleting} autoFocus>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

