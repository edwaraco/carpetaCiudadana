/**
 * Authentication API Service - Real Implementation
 * Makes actual HTTP calls to the backend API
 */

import { httpClient } from '../../../../shared/utils/httpClient';
import { ApiResponse } from '../../../../shared/utils/api.types';
import { IAuthService } from '../IAuthService';
import {
  LoginRequest,
  LoginResponse,
  MFAVerificationRequest,
  MFAVerificationResponse,
} from '../../domain/types';

export class AuthApiService implements IAuthService {
  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return httpClient.post<LoginResponse>('/auth/login', request);
  }

  async verifyMFA(request: MFAVerificationRequest): Promise<ApiResponse<MFAVerificationResponse>> {
    return httpClient.post<MFAVerificationResponse>('/auth/verify-mfa', request);
  }

  async logout(): Promise<ApiResponse<void>> {
    return httpClient.post<void>('/auth/logout');
  }

  async refreshToken(): Promise<ApiResponse<{ token: string; expiresAt: Date }>> {
    return httpClient.post<{ token: string; expiresAt: Date }>('/auth/refresh');
  }
}

