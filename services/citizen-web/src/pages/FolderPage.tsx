/**
 * Folder Page
 * Main page displaying folder information and storage statistics
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Grid, Typography } from '@mui/material';
import { FolderInfo, StorageStatistics } from '../contexts/folder/components';

export const FolderPage: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('folderPage.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {t('folderPage.subtitle')}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FolderInfo />
          </Grid>
          <Grid item xs={12} md={6}>
            <StorageStatistics />
          </Grid>
        </Grid>
    </Container>
  );
};

