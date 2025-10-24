/**
 * Documents Page
 * Main page for document management (upload, view, list)
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Box, Tabs, Tab } from '@mui/material';
import { DocumentList, UploadDocumentForm } from '../contexts/documents/components';

export const DocumentsPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.ChangeEvent<unknown>, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleUploadSuccess = (documentId: string) => {
    console.log('Document uploaded:', documentId);
    setActiveTab(0); // Switch to list view
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label={t('documentsPage.tabs.myDocuments')} />
            <Tab label={t('documentsPage.tabs.uploadDocument')} />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <DocumentList
            onUploadClick={() => setActiveTab(1)}
            onViewDocument={(documentId) => console.log('View document:', documentId)}
          />
        )}

        {activeTab === 1 && (
          <UploadDocumentForm
            onSuccess={handleUploadSuccess}
            onCancel={() => setActiveTab(0)}
          />
        )}
    </Container>
  );
};

