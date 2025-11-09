/**
 * Authentication Context
 * Provides authentication state and methods to the entire app
 */

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/contexts/authentication/infrastructure';
import type { Citizen } from '@/contexts/identity/domain/types';
import type { LoginRequest, MFAVerificationRequest, MFAType, RegisterRequest, SetPasswordRequest } from '@/contexts/authentication/domain/types';
import type { ApiError } from '@/shared/utils/api.types';

interface AuthContextValue {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: Citizen | null;
  token: string | null;
  error: ApiError | null;
  requiresMFA: boolean;
  sessionId: string | null;
  registrationMessage: string | null;

  // Methods
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<{ success: boolean; cedula?: string }>;
  setPassword: (request: SetPasswordRequest) => Promise<void>;
  verifyMFA: (code: string, type: MFAType) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<Citizen | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Failed to parse stored user:', err);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (request: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(request);

      if (response.success && response.data) {
        if (response.data.requiresMFA) {
          // MFA required - don't set authenticated yet
          setRequiresMFA(true);
          setSessionId(response.data.sessionId || null);
          setUser(response.data.user);
        } else {
          // No MFA required - login complete
          setToken(response.data.token);
          setUser(response.data.user);
          setIsAuthenticated(true);
          setRequiresMFA(false);

          // Store in localStorage
          localStorage.setItem('auth_token', response.data.token);
          localStorage.setItem('auth_user', JSON.stringify(response.data.user));
        }
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError({
        code: 'LOGIN_ERROR',
        message: 'An unexpected error occurred during login',
        statusCode: 500,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyMFA = useCallback(async (code: string, type: MFAType) => {
    if (!sessionId) {
      setError({
        code: 'NO_SESSION',
        message: 'No active session for MFA verification',
        statusCode: 400,
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: MFAVerificationRequest = {
        sessionId,
        mfaCode: code,
        mfaType: type,
      };

      const response = await authService.verifyMFA(request);

      if (response.success && response.data?.verified) {
        if (response.data.token) {
          setToken(response.data.token);
          setIsAuthenticated(true);
          setRequiresMFA(false);
          setSessionId(null);

          // Store in localStorage
          localStorage.setItem('auth_token', response.data.token);
          if (user) {
            localStorage.setItem('auth_user', JSON.stringify(user));
          }
        }
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError({
        code: 'MFA_ERROR',
        message: 'An unexpected error occurred during MFA verification',
        statusCode: 500,
      });
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, user]);

  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear state regardless of API call success
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setRequiresMFA(false);
      setSessionId(null);
      setError(null);

      // Clear localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (request: RegisterRequest): Promise<{ success: boolean; cedula?: string }> => {
    setIsLoading(true);
    setError(null);
    setRegistrationMessage(null);

    try {
      const response = await authService.register(request);

      if (response.success && response.data) {
        setRegistrationMessage(response.data.message);
        return { success: true, cedula: response.data.cedula };
      } else if (response.error) {
        setError(response.error);
        return { success: false };
      }
      return { success: false };
    } catch (err) {
      setError({
        code: 'REGISTRATION_ERROR',
        message: 'An unexpected error occurred during registration',
        statusCode: 500,
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setPassword = useCallback(async (request: SetPasswordRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.setPassword(request);

      if (response.success && response.data) {
        // Auto-login after setting password
        setToken(response.data.token);
        setUser(response.data.user);
        setIsAuthenticated(true);

        // Store in localStorage
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('auth_user', JSON.stringify(response.data.user));
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError({
        code: 'SET_PASSWORD_ERROR',
        message: 'An unexpected error occurred while setting password',
        statusCode: 500,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setRegistrationMessage(null);
  }, []);

  const value: AuthContextValue = {
    isAuthenticated,
    isLoading,
    user,
    token,
    error,
    requiresMFA,
    sessionId,
    registrationMessage,
    login,
    register,
    setPassword,
    verifyMFA,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

