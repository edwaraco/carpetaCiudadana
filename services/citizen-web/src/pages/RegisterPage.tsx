/**
 * Register Page
 * Page for citizen registration
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Box } from '@mui/material';
import { RegisterCitizenForm } from '../contexts/identity/components';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('identity');

  const handleSuccess = (folderEmail: string) => {
    console.log('Registration successful! Folder email:', folderEmail);
    // Redirect to login after successful registration
    setTimeout(() => {
      navigate('/login', {
        state: {
          message: t('registerPage.successMessage'),
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

