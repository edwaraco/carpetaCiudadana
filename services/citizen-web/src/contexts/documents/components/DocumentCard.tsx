/**
 * Document Card Component
 * Displays individual document information
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  VerifiedUser as CertifiedIcon,
  Schedule as TemporaryIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { Document, DocumentStatus } from '@/contexts/documents/domain/types';
import { DownloadDocumentButton } from '@/contexts/documents/components/DownloadDocumentButton';
import { AuthenticateDocumentButton } from '@/contexts/documents/components/AuthenticateDocumentButton';

interface DocumentCardProps {
  document: Document;
  onView?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onDelete,
}) => {
  const getStatusColor = (status: DocumentStatus): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'CERTIFIED':
        return 'success';
      case 'TEMPORARY':
        return 'warning';
      case 'REVOKED':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'CERTIFIED':
        return <CertifiedIcon fontSize="small" />;
      case 'TEMPORARY':
        return <TemporaryIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const getFormatIcon = () => {
    switch (document.content.format) {
      case 'PDF':
        return <PdfIcon sx={{ fontSize: 48, color: 'error.main' }} />;
      case 'JPEG':
      case 'PNG':
        return <ImageIcon sx={{ fontSize: 48, color: 'info.main' }} />;
      default:
        return <PdfIcon sx={{ fontSize: 48, color: 'action.active' }} />;
    }
  };

  const canDelete = document.documentStatus !== 'CERTIFIED';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="center" mb={2}>
          {getFormatIcon()}
        </Box>

        <Typography variant="h6" gutterBottom noWrap title={document.metadata.title}>
          {document.metadata.title}
        </Typography>

        <Stack direction="row" spacing={1} mb={2}>
          <Chip
            label={document.documentStatus}
            color={getStatusColor(document.documentStatus)}
            size="small"
            icon={getStatusIcon(document.documentStatus) || undefined}
          />
          <Chip label={document.metadata.type} size="small" variant="outlined" />
        </Stack>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Context: {document.metadata.context}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Size: {(document.content.sizeBytes / 1024).toFixed(2)} KB
        </Typography>

        {document.metadata.issuingEntity && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Issued by: {document.metadata.issuingEntity}
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary" display="block" mt={2}>
          Received: {new Date(document.receptionDate).toLocaleDateString()}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          {onView && (
            <Tooltip title="View Document">
              <IconButton size="small" onClick={() => onView(document.documentId)}>
                <ViewIcon />
              </IconButton>
            </Tooltip>
          )}
          <DownloadDocumentButton
            documentId={document.documentId}
            documentTitle={document.metadata.title}
            size="small"
          />
          <AuthenticateDocumentButton
            documentId={document.documentId}
            documentTitle={document.metadata.title}
            size="small"
          />
        </Box>

        {canDelete && onDelete && (
          <Tooltip title="Delete Document">
            <IconButton size="small" color="error" onClick={() => onDelete(document.documentId)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

