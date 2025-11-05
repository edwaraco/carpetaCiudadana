/**
 * LoginForm Component
 * Handles user login with email and password
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
  initialEmail?: string;
  onSuccess?: () => void;
  onMFARequired?: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  initialEmail = '',
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
      email: initialEmail,
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
      email: data.email,
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

      {/* Email */}
      <Controller
        name="email"
        control={control}
        rules={{
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address',
          },
        }}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={isLoading}
            autoComplete="email"
            autoFocus
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

