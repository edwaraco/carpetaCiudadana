/**
 * Login Page
 * Page for user authentication with optional MFA
 */

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
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
              {showMFA ? 'Verify Identity' : 'Welcome Back'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {showMFA
                ? 'Complete MFA verification to continue'
                : 'Login to access your Carpeta Ciudadana'}
            </Typography>
          </Box>

          {state?.message && !showMFA && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {state.message}
            </Alert>
          )}

          {!mfaRequired && !showMFA && (
            <Alert severity="info" sx={{ mb: 3 }}>
              MFA is optional. You can skip it or use it for additional security.
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
                  Don't have an account?{' '}
                  <Link href="/register" sx={{ cursor: 'pointer' }}>
                    Register here
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

