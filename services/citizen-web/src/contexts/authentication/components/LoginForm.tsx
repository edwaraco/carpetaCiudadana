/**
 * LoginForm Component
 * Handles user login with cedula (document ID) and password
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';

interface LoginFormProps {
  initialCedula?: string;
  onSuccess?: () => void;
  onMFARequired?: () => void;
}

interface LoginFormData {
  cedula: string;
  password: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  initialCedula = '',
  onSuccess,
  onMFARequired,
}) => {
  const navigate = useNavigate();
  const { login, isLoading, error, requiresMFA, isAuthenticated, clearError } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      cedula: initialCedula,
      password: '',
    },
  });

  // Handle successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      onSuccess?.();
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, onSuccess]);

  // Handle MFA required
  useEffect(() => {
    if (requiresMFA) {
      onMFARequired?.();
    }
  }, [requiresMFA, onMFARequired]);

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    await login({
      cedula: data.cedula,
      password: data.password,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {/* Cédula */}
      <Controller
        name="cedula"
        control={control}
        rules={{
          required: 'Cédula is required',
          pattern: {
            value: /^\d{6,10}$/,
            message: 'Cédula must be 6-10 digits',
          },
        }}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Cédula"
            type="text"
            margin="normal"
            error={!!errors.cedula}
            helperText={errors.cedula?.message}
            disabled={isLoading}
            autoComplete="username"
            autoFocus
            placeholder="1234567890"
          />
        )}
      />

      {/* Password */}
      <Controller
        name="password"
        control={control}
        rules={{
          required: 'Password is required',
          minLength: {
            value: 6,
            message: 'Password must be at least 6 characters',
          },
        }}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            margin="normal"
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={isLoading}
            autoComplete="current-password"
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

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        sx={{ mt: 3, mb: 2 }}
        disabled={isLoading}
        startIcon={isLoading && <CircularProgress size={20} />}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </Box>
  );
};

