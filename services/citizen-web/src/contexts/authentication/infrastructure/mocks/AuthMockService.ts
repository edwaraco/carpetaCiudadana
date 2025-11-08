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
  RegisterRequest,
  RegisterResponse,
  SetPasswordRequest,
  SetPasswordResponse,
} from '../../domain/types';

export class AuthMockService implements IAuthService {
  // Store for simulating registered users
  private registeredUsers: Map<string, { email: string; fullName: string; phone?: string; address?: string; verificationToken?: string; password?: string }> = new Map();

  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    await this.simulateDelay();

    // Simulate validation - use cedula '1234567890' with password 'password123' for testing
    if (request.cedula === '1234567890' && request.password === 'password123') {
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
          personalEmail: 'juan.perez@example.com',
          folderEmail: 'juan.perez.1234567890@carpetacolombia.co',
          currentOperator: 'MiCarpeta',
          registrationDate: new Date('2024-01-15'),
          status: 'ACTIVE',
          carpetaId: 'df32bb71-ffb3-4693-8680-e0d316a2acef',
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
        message: 'Invalid cedula or password',
        statusCode: 401,
      },
      timestamp: new Date(),
    };
  }

  async register(request: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    await this.simulateDelay();

    // Check if user already exists
    if (this.registeredUsers.has(request.cedula)) {
      return {
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'User with this cedula already exists',
          statusCode: 409,
        },
        timestamp: new Date(),
      };
    }

    // Generate mock verification token
    const mockToken = `mock-verification-token-${Date.now()}`;

    // Store user data
    this.registeredUsers.set(request.cedula, {
      email: request.email,
      fullName: request.fullName,
      phone: request.phone,
      address: request.address,
      verificationToken: mockToken,
    });

    // In production, this would send an email
    console.log(`📧 [MOCK] Verification email sent to ${request.email}`);
    console.log(`🔑 [MOCK] Verification token: ${mockToken}`);
    console.log(`ℹ️  [MOCK] Use this token in /set-password to complete registration`);

    const mockResponse: RegisterResponse = {
      message: 'Registration initiated. Please check your email for verification link.',
      cedula: request.cedula,
    };

    return {
      success: true,
      data: mockResponse,
      message: mockResponse.message,
      timestamp: new Date(),
    };
  }

  async setPassword(request: SetPasswordRequest): Promise<ApiResponse<SetPasswordResponse>> {
    await this.simulateDelay();

    // Find user by token
    let foundCedula: string | undefined;
    let foundUser: any;

    for (const [cedula, userData] of this.registeredUsers.entries()) {
      if (userData.verificationToken === request.token) {
        foundCedula = cedula;
        foundUser = userData;
        break;
      }
    }

    if (!foundCedula || !foundUser) {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token',
          statusCode: 400,
        },
        timestamp: new Date(),
      };
    }

    // Set password and remove token
    foundUser.password = request.password;
    foundUser.verificationToken = undefined;

    // Create citizen object
    const citizen = {
      cedula: foundCedula,
      fullName: foundUser.fullName,
      address: foundUser.address || '',
      personalEmail: foundUser.email,
      folderEmail: `${foundUser.fullName.toLowerCase().replace(/\s+/g, '.')}.${foundCedula}@carpetacolombia.co`,
      currentOperator: 'MiCarpeta',
      registrationDate: new Date(),
      status: 'ACTIVE' as const,
      carpetaId: `mock-carpeta-${foundCedula}`,
    };

    const mockResponse: SetPasswordResponse = {
      token: 'mock-jwt-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      user: citizen,
    };

    console.log(`✅ [MOCK] User ${foundCedula} registration completed successfully`);

    return {
      success: true,
      data: mockResponse,
      message: 'Registration completed successfully! Welcome to the system.',
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

