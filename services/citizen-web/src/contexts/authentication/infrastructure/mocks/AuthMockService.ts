/**
 * Authentication Mock Service
 * Simulates API responses for development/testing
 */

import { ApiResponse } from '../../../../shared/utils/api.types';
import { IAuthService } from '../IAuthService';
import {
  LoginRequest,
  LoginResponse,
  MFAVerificationRequest,
  MFAVerificationResponse,
} from '../../domain/types';

export class AuthMockService implements IAuthService {
  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    await this.simulateDelay();

    // Simulate validation
    if (request.email === 'test@example.com' && request.password === 'password123') {
      // Check if MFA is required from environment
      const { isMFARequired } = await import('@/shared/utils/env');
      const mfaRequired = isMFARequired();

      const mockResponse: LoginResponse = {
        token: mfaRequired ? '' : 'mock-jwt-token-' + Date.now(),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        user: {
          cedula: '1234567890',
          fullName: 'Juan Pérez García',
          address: 'Calle 123 #45-67, Medellín',
          personalEmail: 'test@example.com',
          folderEmail: 'juan.perez.1234567890@carpetacolombia.co',
          currentOperator: 'MiCarpeta',
          registrationDate: new Date('2024-01-15'),
          status: 'ACTIVE',
        },
        requiresMFA: mfaRequired,
        sessionId: mfaRequired ? 'session-' + Date.now() : undefined,
      };

      return {
        success: true,
        data: mockResponse,
        message: mfaRequired
          ? 'Login successful. MFA verification is optional.'
          : 'Login successful.',
        timestamp: new Date(),
      };
    }

    return {
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        statusCode: 401,
      },
      timestamp: new Date(),
    };
  }

  async verifyMFA(request: MFAVerificationRequest): Promise<ApiResponse<MFAVerificationResponse>> {
    await this.simulateDelay();

    // Simulate MFA verification - accept any 6-digit code
    if (request.mfaCode && request.mfaCode.length === 6) {
      const mockResponse: MFAVerificationResponse = {
        verified: true,
        token: 'mock-jwt-token-verified-' + Date.now(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      return {
        success: true,
        data: mockResponse,
        message: 'MFA verified successfully',
        timestamp: new Date(),
      };
    }

    return {
      success: false,
      error: {
        code: 'INVALID_MFA_CODE',
        message: 'Invalid MFA code',
        statusCode: 401,
      },
      timestamp: new Date(),
    };
  }

  async logout(): Promise<ApiResponse<void>> {
    await this.simulateDelay(500);

    return {
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date(),
    };
  }

  async refreshToken(): Promise<ApiResponse<{ token: string; expiresAt: Date }>> {
    await this.simulateDelay(300);

    return {
      success: true,
      data: {
        token: 'mock-refreshed-token-' + Date.now(),
        expiresAt: new Date(Date.now() + 3600000),
      },
      timestamp: new Date(),
    };
  }

  private simulateDelay(ms: number = 800): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

