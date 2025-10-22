/**
 * Authentication Service Interface
 * Contract that both real and mock implementations must follow
 */

import { ApiResponse } from '../../../shared/utils/api.types';
import {
  LoginRequest,
  LoginResponse,
  MFAVerificationRequest,
  MFAVerificationResponse,
} from '../domain/types';

export interface IAuthService {
  login(request: LoginRequest): Promise<ApiResponse<LoginResponse>>;
  verifyMFA(request: MFAVerificationRequest): Promise<ApiResponse<MFAVerificationResponse>>;
  logout(): Promise<ApiResponse<void>>;
  refreshToken(): Promise<ApiResponse<{ token: string; expiresAt: Date }>>;
}

