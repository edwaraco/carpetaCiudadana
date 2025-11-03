/**
 * RegisterCitizenForm Component
 * Form for registering a new citizen
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Paper,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { CheckCircle, ErrorOutline, Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useRegisterCitizen } from '../hooks/useRegisterCitizen';
import { useValidateCitizen } from '../hooks/useValidateCitizen';
import { RegisterCitizenRequest } from '../domain/types';

interface RegisterCitizenFormProps {
  onSuccess?: (folderEmail: string) => void;
  onCancel?: () => void;
}

interface FormData {
  cedula: string;
  fullName: string;
  address: string;
  personalEmail: string;
  confirmEmail: string;
}

export const RegisterCitizenForm: React.FC<RegisterCitizenFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation(['identity', 'common']);
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setError: setFormError,
  } = useForm<FormData>();

  const { registerCitizen, isLoading, error, data } = useRegisterCitizen();
  const {
    validateCitizen,
    isLoading: isValidating,
    data: validationData,
  } = useValidateCitizen();

  const [cedulaChecked, setCedulaChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const cedula = watch('cedula');
  const personalEmail = watch('personalEmail');

  // Validate cedula when it changes
  useEffect(() => {
    if (cedula && cedula.length >= 6) {
      const timeoutId = setTimeout(() => {
        validateCitizen(cedula).then(() => {
          setCedulaChecked(true);
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setCedulaChecked(false);
    }
  }, [cedula, validateCitizen]);

  // Handle successful registration
  useEffect(() => {
    if (data?.folderEmail) {
      onSuccess?.(data.folderEmail);
    }
  }, [data, onSuccess]);

  const onSubmit = async (formData: FormData) => {
    // Validate email confirmation
    if (formData.personalEmail !== formData.confirmEmail) {
      setFormError('confirmEmail', {
        type: 'manual',
        message: t('registration.form.confirmEmail.mismatch'),
      });
      return;
    }

    // Check if cedula is available
    if (validationData && !validationData.available) {
      setFormError('cedula', {
        type: 'manual',
        message: t('registration.errors.cedulaAlreadyRegistered'),
      });
      return;
    }

    const request: RegisterCitizenRequest = {
      cedula: formData.cedula,
      fullName: formData.fullName,
      address: formData.address,
      personalEmail: formData.personalEmail,
    };

    await registerCitizen(request);
  };

  const getCedulaHelperText = (): string => {
    if (!cedula || cedula.length < 6) {
      return t('registration.form.cedula.helperText');
    }
    if (isValidating) {
      return t('registration.form.cedula.validating');
    }
    if (cedulaChecked && validationData) {
      if (validationData.available) {
        return t('registration.form.cedula.available');
      } else {
        return t('registration.form.cedula.alreadyRegistered', {
          operator: validationData.currentOperator
        });
      }
    }
    return '';
  };

  const getCedulaColor = (): 'success' | 'error' | undefined => {
    if (!cedulaChecked || !validationData) return undefined;
    return validationData.available ? 'success' : 'error';
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center">
        {t('registration.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        {t('registration.subtitle')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {data && (
        <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
          <Typography variant="body2" fontWeight="bold">
            {t('registration.success.title')}
          </Typography>
          <Typography variant="body2">
            {t('registration.success.folderEmail')} <strong>{data.folderEmail}</strong>
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            {t('registration.success.immutableEmail')}
          </Typography>
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2}>
          {/* Cedula */}
          <Grid item xs={12}>
            <Controller
              name="cedula"
              control={control}
              defaultValue=""
              rules={{
                required: t('registration.errors.cedulaRequired'),
                pattern: {
                  value: /^[0-9]{6,10}$/,
                  message: t('registration.form.cedula.invalid'),
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('registration.form.cedula.label')}
                  type="text"
                  error={!!errors.cedula || (cedulaChecked && !validationData?.available)}
                  helperText={errors.cedula?.message || getCedulaHelperText()}
                  disabled={isLoading}
                  color={getCedulaColor()}
                  InputProps={{
                    endAdornment: isValidating ? (
                      <CircularProgress size={20} />
                    ) : cedulaChecked && validationData ? (
                      <InputAdornment position="end">
                        {validationData.available ? (
                          <CheckCircle color="success" />
                        ) : (
                          <ErrorOutline color="error" />
                        )}
                      </InputAdornment>
                    ) : null,
                  }}
                />
              )}
            />
          </Grid>

          {/* Full Name */}
          <Grid item xs={12}>
            <Controller
              name="fullName"
              control={control}
              defaultValue=""
              rules={{
                required: t('common:validation.required', { field: t('registration.form.fullName.label') }),
                minLength: {
                  value: 3,
                  message: t('registration.form.fullName.minLength'),
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('registration.form.fullName.label')}
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
                  disabled={isLoading}
                />
              )}
            />
          </Grid>

          {/* Address */}
          <Grid item xs={12}>
            <Controller
              name="address"
              control={control}
              defaultValue=""
              rules={{
                required: t('common:validation.required', { field: t('registration.form.address.label') }),
                minLength: {
                  value: 10,
                  message: t('registration.form.address.minLength'),
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('registration.form.address.label')}
                  multiline
                  rows={2}
                  error={!!errors.address}
                  helperText={errors.address?.message}
                  disabled={isLoading}
                />
              )}
            />
          </Grid>

          {/* Personal Email */}
          <Grid item xs={12}>
            <Controller
              name="personalEmail"
              control={control}
              defaultValue=""
              rules={{
                required: t('common:validation.required', { field: t('registration.form.personalEmail.label') }),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('common:validation.email'),
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('registration.form.personalEmail.label')}
                  type="email"
                  error={!!errors.personalEmail}
                  helperText={
                    errors.personalEmail?.message ||
                    t('registration.form.personalEmail.helperText')
                  }
                  disabled={isLoading}
                />
              )}
            />
          </Grid>

          {/* Confirm Email */}
          <Grid item xs={12}>
            <Controller
              name="confirmEmail"
              control={control}
              defaultValue=""
              rules={{
                required: t('common:validation.required', { field: t('registration.form.confirmEmail.label') }),
                validate: (value) =>
                  value === personalEmail || t('registration.form.confirmEmail.mismatch'),
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('registration.form.confirmEmail.label')}
                  type={showPassword ? 'text' : 'email'}
                  error={!!errors.confirmEmail}
                  helperText={errors.confirmEmail?.message}
                  disabled={isLoading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </Grid>

          {/* Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isLoading || (cedulaChecked && !validationData?.available)}
                startIcon={isLoading && <CircularProgress size={20} />}
              >
                {isLoading ? t('registration.actions.registering') : t('registration.actions.register')}
              </Button>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={isLoading}
                  fullWidth
                >
                  {t('registration.actions.cancel')}
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

