/**
 * Set Password Page
 * Page for completing registration by setting password
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { SetPasswordForm } from '@/contexts/authentication/components';

export const SetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    console.log('Password set successfully! Redirecting to dashboard...');
    // User will be redirected to dashboard by AuthContext after successful setPassword
  };

  const handleCancel = () => {
    navigate('/login');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8 }}>
        <SetPasswordForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Box>
    </Container>
  );
};

