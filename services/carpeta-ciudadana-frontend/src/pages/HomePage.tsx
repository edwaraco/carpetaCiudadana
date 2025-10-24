/**
 * Home Page
 * Landing page for the application
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  PersonAdd,
  Login,
  Folder,
  Security,
  SwapHoriz,
  Description,
} from '@mui/icons-material';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const features = [
    {
      icon: <Folder sx={{ fontSize: 48 }} />,
      title: t('homePage.features.personalFolder.title'),
      description: t('homePage.features.personalFolder.description'),
    },
    {
      icon: <Security sx={{ fontSize: 48 }} />,
      title: t('homePage.features.digitalSecurity.title'),
      description: t('homePage.features.digitalSecurity.description'),
    },
    {
      icon: <SwapHoriz sx={{ fontSize: 48 }} />,
      title: t('homePage.features.operatorPortability.title'),
      description: t('homePage.features.operatorPortability.description'),
    },
    {
      icon: <Description sx={{ fontSize: 48 }} />,
      title: t('homePage.features.easySharing.title'),
      description: t('homePage.features.easySharing.description'),
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h2" gutterBottom fontWeight="bold">
                {t('homePage.hero.title')}
              </Typography>
              <Typography variant="h5" paragraph>
                {t('homePage.hero.subtitle')}
              </Typography>
              <Typography variant="body1" paragraph sx={{ opacity: 0.9 }}>
                {t('homePage.hero.description')}
              </Typography>
              <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  color="secondary"
                  startIcon={<PersonAdd />}
                  onClick={() => navigate('/register')}
                  sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
                >
                  {t('homePage.hero.registerButton')}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Login />}
                  onClick={() => navigate('/login')}
                  sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'grey.300' } }}
                >
                  {t('homePage.hero.loginButton')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          {t('homePage.features.title')}
        </Typography>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 6 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              {t('homePage.cta.title')}
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              {t('homePage.cta.description')}
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<PersonAdd />}
              onClick={() => navigate('/register')}
              sx={{ mt: 2 }}
            >
              {t('homePage.cta.button')}
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

