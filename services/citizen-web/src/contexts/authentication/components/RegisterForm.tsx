/**
 * RegisterForm Component
 * Handles user registration (step 1: initiate registration)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Paper,
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/contexts/authentication/context/AuthContext';

interface RegisterFormProps {
  onSuccess?: (cedula: string) => void;
  onCancel?: () => void;
}

interface RegisterFormData {
  cedula: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('authentication');
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [registeredCedula, setRegisteredCedula] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      cedula: '',
      email: '',
      fullName: '',
      phone: '',
      address: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    setSuccessMessage(null);

    const result = await registerUser({
      cedula: data.cedula,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
    });

    if (result.success && result.cedula) {
      setSuccessMessage(t('registerForm.successMessage'));
      setRegisteredCedula(result.cedula);

      // Call onSuccess callback
      onSuccess?.(result.cedula);

      // Redirect to set-password page after a delay
      setTimeout(() => {
        navigate('/set-password', {
          state: { cedula: result.cedula },
        });
      }, 3000);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }} data-testid="register-form-container">
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <PersonAddIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom data-testid="register-form-title">
          {t('registerForm.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" data-testid="register-form-subtitle">
          {t('registerForm.subtitle')}
        </Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} data-testid="register-form-success-alert">
          {successMessage}
          {registeredCedula && (
            <Typography variant="body2" sx={{ mt: 1 }} data-testid="register-form-cedula-display">
              {t('registerForm.cedulaLabel')}: <strong>{registeredCedula}</strong>
            </Typography>
          )}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="register-form-error-alert">
          {error.message}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="register-form">
        {/* Cédula */}
        <Controller
          name="cedula"
          control={control}
          rules={{
            required: t('registerForm.validation.cedulaRequired'),
            pattern: {
              value: /^\d{6,10}$/,
              message: t('registerForm.validation.cedulaPattern'),
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('registerForm.cedulaLabel')}
              type="text"
              margin="normal"
              error={!!errors.cedula}
              helperText={errors.cedula?.message}
              disabled={isLoading || !!successMessage}
              autoComplete="off"
              autoFocus
              placeholder="1234567890"
              data-testid="register-form-cedula-input"
              inputProps={{
                'data-testid': 'register-form-cedula-field',
              }}
            />
          )}
        />

        {/* Full Name */}
        <Controller
          name="fullName"
          control={control}
          rules={{
            required: t('registerForm.validation.fullNameRequired'),
            minLength: {
              value: 3,
              message: t('registerForm.validation.fullNameMinLength'),
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('registerForm.fullNameLabel')}
              type="text"
              margin="normal"
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
              disabled={isLoading || !!successMessage}
              autoComplete="name"
              placeholder="Juan Pérez García"
              data-testid="register-form-fullname-input"
              inputProps={{
                'data-testid': 'register-form-fullname-field',
              }}
            />
          )}
        />

        {/* Email */}
        <Controller
          name="email"
          control={control}
          rules={{
            required: t('registerForm.validation.emailRequired'),
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: t('registerForm.validation.emailPattern'),
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('registerForm.emailLabel')}
              type="email"
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={isLoading || !!successMessage}
              autoComplete="email"
              placeholder="juan.perez@example.com"
              data-testid="register-form-email-input"
              inputProps={{
                'data-testid': 'register-form-email-field',
              }}
            />
          )}
        />

        {/* Phone (Optional) */}
        <Controller
          name="phone"
          control={control}
          rules={{
            pattern: {
              value: /^\+?[\d\s-()]+$/,
              message: t('registerForm.validation.phonePattern'),
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('registerForm.phoneLabel')}
              type="tel"
              margin="normal"
              error={!!errors.phone}
              helperText={errors.phone?.message}
              disabled={isLoading || !!successMessage}
              autoComplete="tel"
              placeholder="+573001234567"
              data-testid="register-form-phone-input"
              inputProps={{
                'data-testid': 'register-form-phone-field',
              }}
            />
          )}
        />

        {/* Address (Optional) */}
        <Controller
          name="address"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('registerForm.addressLabel')}
              type="text"
              margin="normal"
              error={!!errors.address}
              helperText={errors.address?.message}
              disabled={isLoading || !!successMessage}
              autoComplete="street-address"
              placeholder="Calle 123 #45-67, Medellín"
              multiline
              rows={2}
              data-testid="register-form-address-input"
              inputProps={{
                'data-testid': 'register-form-address-field',
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
            disabled={isLoading || !!successMessage}
            startIcon={isLoading && <CircularProgress size={20} />}
            data-testid="register-form-submit-button"
          >
            {isLoading ? t('registerForm.submitting') : t('registerForm.submitButton')}
          </Button>

          {onCancel && (
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={onCancel}
              disabled={isLoading}
              data-testid="register-form-cancel-button"
            >
              {t('registerForm.cancelButton')}
            </Button>
          )}
        </Box>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" data-testid="register-form-login-prompt">
            {t('registerForm.hasAccount')}{' '}
            <Button
              variant="text"
              onClick={() => navigate('/login')}
              disabled={isLoading}
              data-testid="register-form-login-link"
            >
              {t('registerForm.loginLink')}
            </Button>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

