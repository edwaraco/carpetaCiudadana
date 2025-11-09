/**
 * SetPasswordForm Component
 * Handles password setup after email verification (step 2: complete registration)
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { LockReset as LockResetIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/contexts/authentication/context/AuthContext';

interface SetPasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface SetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export const SetPasswordForm: React.FC<SetPasswordFormProps> = ({ onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('authentication');
  const [searchParams] = useSearchParams();
  const { setPassword, isLoading, error, clearError, isAuthenticated } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SetPasswordFormData>({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  // Extract token from URL on mount
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      setTokenError(false);
    } else {
      setTokenError(true);
    }
  }, [searchParams]);

  // Redirect to dashboard after successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      onSuccess?.();
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, onSuccess]);

  const onSubmit = async (data: SetPasswordFormData) => {
    if (!token) {
      setTokenError(true);
      return;
    }

    clearError();

    await setPassword({
      token,
      password: data.password,
    });
  };

  if (tokenError) {
    return (
      <Paper elevation={3} sx={{ p: 4 }} data-testid="set-password-form-container">
        <Box sx={{ textAlign: 'center' }}>
          <LockResetIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="error" data-testid="set-password-invalid-token-title">
            {t('setPasswordForm.invalidToken')}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
            data-testid="set-password-back-to-login-button"
          >
            {t('setPasswordForm.backToLogin')}
          </Button>
        </Box>
      </Paper>
    );
  }

  if (!token) {
    return (
      <Paper elevation={3} sx={{ p: 4 }} data-testid="set-password-loading-container">
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4 }} data-testid="set-password-form-container">
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <LockResetIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom data-testid="set-password-form-title">
          {t('setPasswordForm.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" data-testid="set-password-form-subtitle">
          {t('setPasswordForm.subtitle')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="set-password-form-error-alert">
          {error.message}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="set-password-form">
        {/* Password */}
        <Controller
          name="password"
          control={control}
          rules={{
            required: t('setPasswordForm.validation.passwordRequired'),
            minLength: {
              value: 8,
              message: t('setPasswordForm.validation.passwordMinLength'),
            },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
              message: t('setPasswordForm.validation.passwordPattern'),
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('setPasswordForm.passwordLabel')}
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={isLoading}
              autoComplete="new-password"
              autoFocus
              data-testid="set-password-form-password-input"
              inputProps={{
                'data-testid': 'set-password-form-password-field',
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      data-testid="set-password-form-toggle-password"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        {/* Confirm Password */}
        <Controller
          name="confirmPassword"
          control={control}
          rules={{
            required: t('setPasswordForm.validation.confirmPasswordRequired'),
            validate: (value) =>
              value === password || t('setPasswordForm.validation.passwordsDoNotMatch'),
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('setPasswordForm.confirmPasswordLabel')}
              type={showConfirmPassword ? 'text' : 'password'}
              margin="normal"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              disabled={isLoading}
              autoComplete="new-password"
              data-testid="set-password-form-confirm-password-input"
              inputProps={{
                'data-testid': 'set-password-form-confirm-password-field',
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      data-testid="set-password-form-toggle-confirm-password"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            startIcon={isLoading && <CircularProgress size={20} />}
            data-testid="set-password-form-submit-button"
          >
            {isLoading ? t('setPasswordForm.submitting') : t('setPasswordForm.submitButton')}
          </Button>

          {onCancel && (
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={onCancel}
              disabled={isLoading}
              data-testid="set-password-form-cancel-button"
            >
              {t('setPasswordForm.cancelButton')}
            </Button>
          )}
        </Box>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            variant="text"
            onClick={() => navigate('/login')}
            disabled={isLoading}
            data-testid="set-password-form-login-link"
          >
            {t('setPasswordForm.backToLogin')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

