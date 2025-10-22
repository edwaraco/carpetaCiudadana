/**
 * Folder Page
 * Main page displaying folder information and storage statistics
 */

import React from 'react';
import { Container, Grid, Box, Typography } from '@mui/material';
import { FolderInfo, StorageStatistics } from '../contexts/folder/components';

export const FolderPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Folder
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          View your personal folder information and storage usage
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

