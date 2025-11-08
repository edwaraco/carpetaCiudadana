/**
 * Authentication API Service - Real Implementation
 * Makes actual HTTP calls to the auth-service backend
 */

import axios, { AxiosError } from 'axios';
import type { ApiResponse } from '@/shared/utils/api.types';
import type { IAuthService } from '@/contexts/authentication/infrastructure/IAuthService';
import type {
  LoginRequest,
  LoginResponse,
  MFAVerificationRequest,
  MFAVerificationResponse,
  RegisterRequest,
  RegisterResponse,
  SetPasswordRequest,
  SetPasswordResponse,
} from '@/contexts/authentication/domain/types';
import type { Citizen } from '@/contexts/identity/domain/types';
import type {
  AuthServiceLoginRequest,
  AuthServiceLoginResponse,
  RegisterApiRequest,
  RegisterApiResponse,
  SetPasswordApiRequest,
  SetPasswordApiResponse,
} from './auth-api.types';
import { getEnvVar } from '@/shared/utils/env';

export class AuthApiService implements IAuthService {
  private authServiceUrl: string;

  constructor() {
    // Get auth-service URL from environment, fallback to localhost
    this.authServiceUrl = getEnvVar('VITE_AUTH_SERVICE_URL') || 'http://localhost:8081';
  }

  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      // Map domain request to auth-service API request
      const apiRequest: AuthServiceLoginRequest = {
        document_id: request.cedula,
        password: request.password,
      };

      // Call auth-service login endpoint
      const response = await axios.post<AuthServiceLoginResponse>(
        `${this.authServiceUrl}/auth/login`,
        apiRequest
      );

      const apiResponse = response.data;

      // Map auth-service response to domain response
      // Note: auth-service returns minimal user info, we'll need to fetch full profile
      // from identity-registry service in the future
      const citizen: Citizen = {
        cedula: apiResponse.document_id,
        fullName: apiResponse.document_id, // Temporary - should come from identity-registry
        address: '', // Should come from identity-registry
        personalEmail: '', // Should come from identity-registry
        folderEmail: `user.${apiResponse.document_id}@carpetacolombia.co`, // Temporary format
        currentOperator: 'MiCarpeta', // Should come from identity-registry
        registrationDate: new Date(), // Should come from identity-registry
        status: 'ACTIVE',
        carpetaId: '', // Should come from identity-registry
      };

      const loginResponse: LoginResponse = {
        token: apiResponse.token,
        expiresAt: new Date(apiResponse.expires_at),
        user: citizen,
        requiresMFA: false, // auth-service doesn't support MFA yet
        sessionId: undefined,
      };

      return {
        success: true,
        data: loginResponse,
        message: apiResponse.message,
        timestamp: new Date(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async register(request: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    try {
      // Map domain request to auth-service API request
      const apiRequest: RegisterApiRequest = {
        document_id: request.cedula,
        email: request.email,
        full_name: request.fullName,
        phone: request.phone,
        address: request.address,
      };

      // Call auth-service register endpoint
      const response = await axios.post<RegisterApiResponse>(
        `${this.authServiceUrl}/auth/register`,
        apiRequest
      );

      const apiResponse = response.data;

      const registerResponse: RegisterResponse = {
        message: apiResponse.message,
        cedula: apiResponse.document_id,
      };

      return {
        success: true,
        data: registerResponse,
        message: apiResponse.message,
        timestamp: new Date(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async setPassword(request: SetPasswordRequest): Promise<ApiResponse<SetPasswordResponse>> {
    try {
      // Map domain request to auth-service API request
      const apiRequest: SetPasswordApiRequest = {
        token: request.token,
        password: request.password,
      };

      // Call auth-service set-password endpoint
      const response = await axios.post<SetPasswordApiResponse>(
        `${this.authServiceUrl}/auth/set-password`,
        apiRequest
      );

      const apiResponse = response.data;

      // Map user profile to Citizen domain type
      const citizen: Citizen = {
        cedula: apiResponse.user.document_id,
        fullName: apiResponse.user.full_name,
        address: apiResponse.user.address || '',
        personalEmail: apiResponse.user.email,
        folderEmail: `${apiResponse.user.full_name.toLowerCase().replace(/\s+/g, '.')}.${apiResponse.user.document_id}@carpetacolombia.co`,
        currentOperator: 'MiCarpeta',
        registrationDate: new Date(),
        status: 'ACTIVE',
        carpetaId: '', // Should be generated or fetched from identity-registry
      };

      const setPasswordResponse: SetPasswordResponse = {
        token: apiResponse.token,
        expiresAt: new Date(apiResponse.expires_at),
        user: citizen,
      };

      return {
        success: true,
        data: setPasswordResponse,
        message: apiResponse.message,
        timestamp: new Date(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async verifyMFA(request: MFAVerificationRequest): Promise<ApiResponse<MFAVerificationResponse>> {
    // MFA not supported by auth-service yet
    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'MFA verification not implemented in auth-service',
        statusCode: 501,
      },
      timestamp: new Date(),
    };
  }

  async logout(): Promise<ApiResponse<void>> {
    // Logout is client-side only (remove token from localStorage)
    return {
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date(),
    };
  }

  async refreshToken(): Promise<ApiResponse<{ token: string; expiresAt: Date }>> {
    // Token refresh not implemented in auth-service yet
    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Token refresh not implemented in auth-service',
        statusCode: 501,
      },
      timestamp: new Date(),
    };
  }

  private handleError<T>(error: unknown): ApiResponse<T> {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ success: false; error: string; message: string }>;

      return {
        success: false,
        error: {
          code: axiosError.response?.data?.error || 'AUTH_SERVICE_ERROR',
          message: axiosError.response?.data?.message || axiosError.message || 'Authentication failed',
          statusCode: axiosError.response?.status || 500,
        },
        timestamp: new Date(),
      };
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        statusCode: 500,
      },
      timestamp: new Date(),
    };
  }
}

