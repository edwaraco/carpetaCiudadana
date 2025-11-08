/**
 * Authentication API Service - Real Implementation
 * Makes actual HTTP calls to the auth-service backend
 */

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
import { httpClient } from '@/shared/utils/httpClient';

export class AuthApiService implements IAuthService {
  private basePath: string = '/auth';

  constructor() {
    // Uses httpClient with baseURL=/api/v1
    // Nginx proxies /api/auth/* to auth-service:8080
  }

  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const apiRequest: AuthServiceLoginRequest = {
        document_id: request.cedula,
        password: request.password,
      };

      const response = await httpClient.post<AuthServiceLoginResponse>(
        `${this.basePath}/login`,
        apiRequest
      );

      if (response.success && response.data) {
        const apiResponse = response.data;

        const citizen: Citizen = {
          cedula: apiResponse.user.user_id,
          fullName: apiResponse.user.full_name,
          address: '',
          personalEmail: apiResponse.user.email,
          folderEmail: apiResponse.user.email,
          currentOperator: 'MiCarpeta',
          registrationDate: new Date(),
          status: 'ACTIVE',
          carpetaId: apiResponse.user.folder_id,
        };

        const loginResponse: LoginResponse = {
          token: apiResponse.token,
          expiresAt: new Date(apiResponse.expires_at),
          user: citizen,
          requiresMFA: false,
          sessionId: undefined,
        };

        return {
          success: true,
          data: loginResponse,
          message: apiResponse.message,
          timestamp: new Date(),
        };
      }

      return {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication failed',
          statusCode: 401,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async register(request: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    try {
      const apiRequest: RegisterApiRequest = {
        document_id: request.cedula,
        email: request.email,
        full_name: request.fullName,
        phone: request.phone,
        address: request.address,
      };

      const response = await httpClient.post<RegisterApiResponse>(
        `${this.basePath}/register`,
        apiRequest
      );

      if (response.success && response.data) {
        const apiResponse = response.data;

        const registerResponse: RegisterResponse = {
          message: apiResponse.message,
          cedula: apiResponse.citizen_id,
        };

        return {
          success: true,
          data: registerResponse,
          message: apiResponse.message,
          timestamp: new Date(),
        };
      }

      return {
        success: false,
        error: {
          code: 'REGISTER_ERROR',
          message: 'Registration failed',
          statusCode: 400,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async setPassword(request: SetPasswordRequest): Promise<ApiResponse<SetPasswordResponse>> {
    try {
      const apiRequest: SetPasswordApiRequest = {
        token: request.token,
        password: request.password,
      };

      const response = await httpClient.post<SetPasswordApiResponse>(
        `${this.basePath}/set-password`,
        apiRequest
      );

      if (response.success && response.data) {
        const apiResponse = response.data;

        const citizen: Citizen = {
          cedula: apiResponse.user.user_id,
          fullName: apiResponse.user.full_name,
          address: apiResponse.user.address || '',
          personalEmail: apiResponse.user.email,
          folderEmail: apiResponse.user.email,
          currentOperator: 'MiCarpeta',
          registrationDate: new Date(),
          status: 'ACTIVE',
          carpetaId: apiResponse.user.folder_id,
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
      }

      return {
        success: false,
        error: {
          code: 'SET_PASSWORD_ERROR',
          message: 'Failed to set password',
          statusCode: 400,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async verifyMFA(_: MFAVerificationRequest): Promise<ApiResponse<MFAVerificationResponse>> {
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

  private handleError<T>(_error: unknown): ApiResponse<T> {
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

