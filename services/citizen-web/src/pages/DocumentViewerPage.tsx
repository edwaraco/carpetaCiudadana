/**
 * Document Viewer Page
 * Page for viewing individual document details with certification status
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { ArrowBack as BackIcon, Download as DownloadIcon } from '@mui/icons-material';
import { DocumentViewer } from '@/contexts/documents/components/DocumentViewer';
import { useDocuments } from '@/contexts/documents/hooks/useDocuments';
import { useDownloadDocument } from '@/contexts/documents/hooks/useDownloadDocument';
import { useTranslation } from 'react-i18next';

export const DocumentViewerPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { t: tDocuments } = useTranslation('documents');
  const { t: tCommon } = useTranslation('common');
  const { documents, isLoading, error } = useDocuments();
  const { downloadDocument, isDownloading } = useDownloadDocument();

  const document = documents.find((doc) => doc.documentId === documentId);

  const handleBack = () => {
    navigate('/documents');
  };

  const handleDownload = async () => {
    if (document) {
      await downloadDocument(document.documentId, document.metadata.title);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={handleBack}>
          {tCommon('actions.back')}
        </Button>
      </Container>
    );
  }

  if (!document) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {tDocuments('viewer.documentNotFound')}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={handleBack}>
          {tCommon('actions.back')}
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Action Buttons */}
      <Stack direction="row" spacing={2} mb={3}>
        <Button startIcon={<BackIcon />} onClick={handleBack}>
          {tCommon('actions.back')}
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? tDocuments('downloading') : tDocuments('download')}
        </Button>
      </Stack>

      {/* Document Viewer Component */}
      <DocumentViewer document={document} />
    </Container>
  );
};

