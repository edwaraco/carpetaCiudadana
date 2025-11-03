/**
 * Dashboard Page
 * Main dashboard for authenticated users
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { isFeatureEnabled, type FeatureFlag } from '@/shared/config/featureFlags';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { statistics, isLoading: loadingStats } = useFolderStatistics();
  const { requests, isLoading: loadingRequests } = useRequests(1, 100);

  const pendingRequests = requests.filter((req) =>
    ['CREATED', 'NOTIFIED', 'IN_PROCESS'].includes(req.requestStatus)
  ).length;

  const stats = [
    {
      id: 'total',
      label: t('dashboardPage.stats.totalDocuments'),
      value: statistics?.totalDocuments.toString() || '0',
      color: 'primary',
    },
    {
      id: 'certified',
      label: t('dashboardPage.stats.certified'),
      value: statistics?.certifiedDocuments.toString() || '0',
      color: 'success',
    },
    {
      id: 'temp',
      label: t('dashboardPage.stats.temporary'),
      value: statistics?.temporaryDocuments.toString() || '0',
      color: 'warning',
    },
    {
      id: 'pending',
      label: t('dashboardPage.stats.pendingRequests'),
      value: pendingRequests.toString(),
      color: 'error',
    },
  ];

  const quickActions = [
    {
      icon: <CloudUpload sx={{ fontSize: 40 }} />,
      title: t('dashboardPage.quickActions.uploadDocument.title'),
      description: t('dashboardPage.quickActions.uploadDocument.description'),
      action: () => navigate('/documents'),
      color: 'primary',
      id: 'upload-document',
      feature: 'UPLOAD_DOCUMENTS' as FeatureFlag,
    },
    {
      icon: <Folder sx={{ fontSize: 40 }} />,
      title: t('dashboardPage.quickActions.myDocuments.title'),
      description: t('dashboardPage.quickActions.myDocuments.description'),
      action: () => navigate('/documents'),
      color: 'info',
      id: 'my-documents',
      feature: 'DOCUMENTS' as FeatureFlag,
    },
    {
      icon: <Inbox sx={{ fontSize: 40 }} />,
      title: t('dashboardPage.quickActions.documentRequests.title'),
      description: t('dashboardPage.quickActions.documentRequests.description'),
      action: () => navigate('/requests'),
      color: 'warning',
      badge: pendingRequests > 0 ? pendingRequests : undefined,
      id: 'requested-document',
      feature: 'DOCUMENT_REQUESTS' as FeatureFlag,
    },
    {
      icon: <SwapHoriz sx={{ fontSize: 40 }} />,
      title: t('dashboardPage.quickActions.changeOperator.title'),
      description: t('dashboardPage.quickActions.changeOperator.description'),
      action: () => navigate('/portability'),
      color: 'secondary',
      id: 'portability',
      feature: 'PORTABILITY' as FeatureFlag,
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
            {t('dashboardPage.welcome', { name: user?.fullName.split(' ')[0] || 'Usuario' })}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('dashboardPage.subtitle')}
          </Typography>
        </Box>

        {/* Stats Section */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color={`${stat.color}.main`} fontWeight="bold" data-testid={`stats-${stat.id}`}>
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
        {isFeatureEnabled('STORAGE_STATS') && (
          <Box sx={{ mb: 4 }}>
            <StorageStatistics />
          </Box>
        )}

        {/* Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            {t('dashboardPage.quickActions.title')}
          </Typography>
          <Grid container spacing={2}>
            {quickActions
              .filter((action) => !action.feature || isFeatureEnabled(action.feature))
              .map((action, index) => (
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
                          data-testid={`badge-${action.id}`}
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
        {isFeatureEnabled('RECENT_ACTIVITY') && (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }} data-testid='dashboard-recent-activities'>
              {t('dashboardPage.recentActivity.title')}
            </Typography>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  {t('dashboardPage.recentActivity.noActivity')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('dashboardPage.recentActivity.description')}
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
    </Container>
  );
};

