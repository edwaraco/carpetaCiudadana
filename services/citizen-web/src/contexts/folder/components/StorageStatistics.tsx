/**
 * Storage Statistics Component
 * Displays storage usage and limits
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import {
  Storage as StorageIcon,
  InsertDriveFile as FileIcon,
  VerifiedUser as CertifiedIcon,
  Schedule as TemporaryIcon,
} from '@mui/icons-material';
import { useFolderStatistics } from '../hooks';
import { STORAGE_LIMITS } from '../domain/types';

export const StorageStatistics: React.FC = () => {
  const { statistics, isLoading, error } = useFolderStatistics();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!statistics) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No statistics available
      </Alert>
    );
  }

  const getUsageColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage < 60) return 'success';
    if (percentage < 85) return 'warning';
    return 'error';
  };

  const usageColor = getUsageColor(statistics.usagePercentage);

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <StorageIcon color="primary" />
          <Typography variant="h6">Storage Statistics</Typography>
        </Box>

        {/* Storage Usage Bar */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Temporary Storage Usage
            </Typography>
            <Chip
              label={`${statistics.usagePercentage}%`}
              size="small"
              color={usageColor}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={statistics.usagePercentage}
            color={usageColor}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="caption" color="text.secondary">
              {statistics.usedSpaceMB} MB used
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {STORAGE_LIMITS.maxTemporarySizeMB} MB total
            </Typography>
          </Box>
        </Box>

        {/* Statistics Grid */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="background.default" borderRadius={2}>
              <FileIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5">{statistics.totalDocuments}</Typography>
              <Typography variant="caption" color="text.secondary">
                Total Documents
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="success.light" borderRadius={2}>
              <CertifiedIcon sx={{ fontSize: 32, color: 'success.dark', mb: 1 }} />
              <Typography variant="h5">{statistics.certifiedDocuments}</Typography>
              <Typography variant="caption" color="text.secondary">
                Certified
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="warning.light" borderRadius={2}>
              <TemporaryIcon sx={{ fontSize: 32, color: 'warning.dark', mb: 1 }} />
              <Typography variant="h5">
                {statistics.temporaryDocuments}/{STORAGE_LIMITS.maxTemporaryDocuments}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Temporary
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="info.light" borderRadius={2}>
              <StorageIcon sx={{ fontSize: 32, color: 'info.dark', mb: 1 }} />
              <Typography variant="h5">{statistics.availableSpaceMB}</Typography>
              <Typography variant="caption" color="text.secondary">
                Available (MB)
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Limits Info */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Stack spacing={0.5}>
            <Typography variant="body2">
              <strong>Storage Limits:</strong>
            </Typography>
            <Typography variant="body2">
              • Certified documents: Unlimited storage (perpetual)
            </Typography>
            <Typography variant="body2">
              • Temporary documents: Maximum {STORAGE_LIMITS.maxTemporaryDocuments} files or{' '}
              {STORAGE_LIMITS.maxTemporarySizeMB} MB
            </Typography>
          </Stack>
        </Alert>
      </CardContent>
    </Card>
  );
};

