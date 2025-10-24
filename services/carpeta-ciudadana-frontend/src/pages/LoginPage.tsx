/**
 * Login Page
 * Page for user authentication with optional MFA
 */

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Paper,
  Typography,
  Alert,
  Link,
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';
import { LoginForm } from '../contexts/authentication/components/LoginForm';
import { MFAVerification } from '../contexts/authentication/components/MFAVerification';
import { useAuth } from '../contexts/authentication/context/AuthContext';
import { isMFARequired } from '@/shared/utils/env';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation('authentication');
  const location = useLocation();
  const state = location.state as { message?: string; folderEmail?: string } | null;
  const { requiresMFA } = useAuth();

  const [showMFA, setShowMFA] = useState(false);

  // Check if MFA is required from environment
  const mfaRequired = isMFARequired();

  const handleMFARequired = () => {
    setShowMFA(true);
  };

  const handleMFASuccess = () => {
    setShowMFA(false);
  };

  const handleMFACancel = () => {
    setShowMFA(false);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              {showMFA ? t('loginPage.verifyTitle') : t('loginPage.welcomeTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {showMFA
                ? t('loginPage.verifySubtitle')
                : t('loginPage.welcomeSubtitle')}
            </Typography>
          </Box>

          {state?.message && !showMFA && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {state.message}
            </Alert>
          )}

          {!mfaRequired && !showMFA && (
            <Alert severity="info" sx={{ mb: 3 }}>
              {t('loginPage.mfaOptional')}
            </Alert>
          )}

          {!showMFA ? (
            <>
              <LoginForm
                initialEmail={state?.folderEmail || ''}
                onMFARequired={handleMFARequired}
              />

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2">
                  {t('loginPage.noAccount')}{' '}
                  <Link href="/register" sx={{ cursor: 'pointer' }}>
                    {t('loginPage.registerHere')}
                  </Link>
                </Typography>
              </Box>
            </>
          ) : (
            <MFAVerification
              onSuccess={handleMFASuccess}
              onCancel={handleMFACancel}
              allowSkip={!mfaRequired}
            />
          )}
        </Paper>
      </Box>
    </Container>
  );
};

