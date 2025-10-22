/**
 * Register Page
 * Page for citizen registration
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { RegisterCitizenForm } from '../contexts/identity/components';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = (folderEmail: string) => {
    console.log('Registration successful! Folder email:', folderEmail);
    // Redirect to login after successful registration
    setTimeout(() => {
      navigate('/login', {
        state: {
          message: 'Registration successful! Please login with your credentials.',
          folderEmail
        }
      });
    }, 3000);
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <RegisterCitizenForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Box>
    </Container>
  );
};

