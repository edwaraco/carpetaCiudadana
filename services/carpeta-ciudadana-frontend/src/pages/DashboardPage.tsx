/**
 * Dashboard Page
 * Main dashboard for authenticated users
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload,
  Folder,
  Inbox,
  SwapHoriz,
  Assessment,
} from '@mui/icons-material';
import { useAuth } from '../contexts/authentication/context/AuthContext';
import { StorageStatistics } from '../contexts/folder/components';
import { useFolderStatistics } from '../contexts/folder/hooks';
import { useRequests } from '../contexts/requests/hooks';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { statistics, isLoading: loadingStats } = useFolderStatistics();
  const { requests, isLoading: loadingRequests } = useRequests(1, 100);

  const pendingRequests = requests.filter((req) =>
    ['CREATED', 'NOTIFIED', 'IN_PROCESS'].includes(req.requestStatus)
  ).length;

  const stats = [
    {
      label: 'Total Documents',
      value: statistics?.totalDocuments.toString() || '0',
      color: 'primary',
    },
    {
      label: 'Certified',
      value: statistics?.certifiedDocuments.toString() || '0',
      color: 'success',
    },
    {
      label: 'Temporary',
      value: statistics?.temporaryDocuments.toString() || '0',
      color: 'warning',
    },
    {
      label: 'Pending Requests',
      value: pendingRequests.toString(),
      color: 'error',
    },
  ];

  const quickActions = [
    {
      icon: <CloudUpload sx={{ fontSize: 40 }} />,
      title: 'Upload Document',
      description: 'Add a new document to your folder',
      action: () => navigate('/documents'),
      color: 'primary',
    },
    {
      icon: <Folder sx={{ fontSize: 40 }} />,
      title: 'My Documents',
      description: 'View and manage your documents',
      action: () => navigate('/documents'),
      color: 'info',
    },
    {
      icon: <Inbox sx={{ fontSize: 40 }} />,
      title: 'Document Requests',
      description: 'Review pending document requests',
      action: () => navigate('/requests'),
      color: 'warning',
      badge: pendingRequests > 0 ? pendingRequests : undefined,
    },
    {
      icon: <SwapHoriz sx={{ fontSize: 40 }} />,
      title: 'Change Operator',
      description: 'Transfer to another operator',
      action: () => navigate('/portability'),
      color: 'secondary',
    },
  ];

  if (loadingStats || loadingRequests) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome back, {user?.fullName.split(' ')[0] || 'User'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your documents and stay up to date with your Carpeta Ciudadana
          </Typography>
        </Box>

        {/* Stats Section */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color={`${stat.color}.main`} fontWeight="bold">
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Storage Statistics */}
        <Box sx={{ mb: 4 }}>
          <StorageStatistics />
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={action.action}
                >
                  <CardContent sx={{ textAlign: 'center', position: 'relative' }}>
                    {action.badge && (
                      <Chip
                        label={action.badge}
                        color="error"
                        size="small"
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                      />
                    )}
                    <Box sx={{ color: `${action.color}.main`, mb: 1 }}>
                      {action.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Recent Activity - Placeholder */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            Recent Activity
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No recent activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your document activity will appear here
              </Typography>
            </Box>
          </Paper>
        </Box>
    </Container>
  );
};

