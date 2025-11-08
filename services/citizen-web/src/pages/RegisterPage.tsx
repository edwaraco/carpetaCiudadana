/**
 * Register Page
 * Page for citizen registration with auth-service
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { RegisterForm } from '@/contexts/authentication/components';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = (cedula: string) => {
    console.log('Registration initiated successfully! Cedula:', cedula);
    // User will be redirected to set-password by the RegisterForm component
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8 }}>
        <RegisterForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Box>
    </Container>
  );
};

