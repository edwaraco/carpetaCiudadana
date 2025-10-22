/**
 * Home Page
 * Landing page for the application
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
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

  const features = [
    {
      icon: <Folder sx={{ fontSize: 48 }} />,
      title: 'Personal Folder',
      description: 'Store all your certified documents in one secure place with unlimited storage.',
    },
    {
      icon: <Security sx={{ fontSize: 48 }} />,
      title: 'Digital Security',
      description: 'Your documents are protected with digital signatures and end-to-end encryption.',
    },
    {
      icon: <SwapHoriz sx={{ fontSize: 48 }} />,
      title: 'Operator Portability',
      description: 'Switch between operators freely while keeping all your documents safe.',
    },
    {
      icon: <Description sx={{ fontSize: 48 }} />,
      title: 'Easy Sharing',
      description: 'Share documents with institutions securely with explicit authorization.',
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
                Carpeta Ciudadana
              </Typography>
              <Typography variant="h5" paragraph>
                Your digital document folder for Colombia
              </Typography>
              <Typography variant="body1" paragraph sx={{ opacity: 0.9 }}>
                The citizen should not be the state's messenger. Store your documents once,
                share them digitally, and access them from anywhere.
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
                  Register Now
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Login />}
                  onClick={() => navigate('/login')}
                  sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'grey.300' } }}
                >
                  Login
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          Key Features
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
              Ready to get started?
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              Join thousands of Colombians who already manage their documents digitally.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<PersonAdd />}
              onClick={() => navigate('/register')}
              sx={{ mt: 2 }}
            >
              Create Your Account
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

