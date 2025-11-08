/**
 * Folder Information Component
 * Displays citizen folder details
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Folder as FolderIcon,
  CheckCircle as ActiveIcon,
} from '@mui/icons-material';
import { useFolder } from '../hooks';
import { FolderStatus } from '../domain/types';

export const FolderInfo: React.FC = () => {
  const { folder, isLoading, error } = useFolder();

  const getStatusColor = (status: FolderStatus): 'success' | 'warning' | 'info' => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'SUSPENDED':
        return 'warning';
      case 'MIGRATION':
        return 'info';
      default:
        return 'info';
    }
  };

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

  if (!folder) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No folder information available
      </Alert>
    );
  }

  const { owner, status, creationDate, folderId } = folder;

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <FolderIcon color="primary" />
            <Typography variant="h6">My Folder</Typography>
          </Box>
          <Chip
            label={status}
            color={getStatusColor(status)}
            size="small"
            icon={status === 'ACTIVE' ? <ActiveIcon /> : undefined}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          {/* Folder ID */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Folder ID
            </Typography>
            <Typography variant="body2">{folderId}</Typography>
          </Box>

          {/* Owner Name */}
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Full Name
              </Typography>
              <Typography variant="body2">{owner.fullName}</Typography>
            </Box>
          </Box>

          {/* Cedula */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Cédula
            </Typography>
            <Typography variant="body2">{owner.cedula}</Typography>
          </Box>

          {/* Folder Email */}
          <Box display="flex" alignItems="center" gap={1}>
            <EmailIcon fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Folder Email (Immutable)
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {owner.folderEmail}
              </Typography>
            </Box>
          </Box>

          {/* Personal Email */}
          <Box display="flex" alignItems="center" gap={1}>
            <EmailIcon fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Personal Email
              </Typography>
              <Typography variant="body2">{owner.personalEmail}</Typography>
            </Box>
          </Box>

          {/* Address */}
          <Box display="flex" alignItems="center" gap={1}>
            <LocationIcon fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Address
              </Typography>
              <Typography variant="body2">
                {owner.address}
              </Typography>
            </Box>
          </Box>

          {/* Creation Date */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Folder Created
            </Typography>
            <Typography variant="body2">{new Date(creationDate).toLocaleDateString()}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

