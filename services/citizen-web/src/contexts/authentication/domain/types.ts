/**
 * Bounded Context: Authentication and Authorization
 * Domain types for authentication, sessions, and permissions
 */

import { Citizen } from '../../identity/domain/types';

export interface UserSession {
  sessionId: string;
  userId: string;
  type: UserType;
  token: string;
  tokenExpiration: Date;
  lastActivity: Date;
  status: SessionStatus;
}

export type UserType = 'CITIZEN' | 'INSTITUTION_OFFICIAL';
export type SessionStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: Date;
  user: Citizen;
  requiresMFA: boolean;
  sessionId?: string;
}

export interface MFAVerificationRequest {
  sessionId: string;
  mfaCode: string;
  mfaType: MFAType;
}

export interface MFAVerificationResponse {
  verified: boolean;
  token?: string;
  expiresAt?: Date;
}

export type MFAType = 'BIOMETRIC' | 'DIGITAL_CERTIFICATE' | 'OTP';

export interface ShareAuthorization {
  authorizationId: string;
  documentOwner: string; // Cedula
  documentIds: string[];
  recipient: string; // Cedula or NIT
  purpose: string;
  authorizationDate: Date;
  expirationDate?: Date;
  permissions: DocumentPermission[];
  status: AuthorizationStatus;
}

export type DocumentPermission = 'READ' | 'DOWNLOAD' | 'SHARE_TO_THIRD_PARTIES';
export type AuthorizationStatus = 'GRANTED' | 'REVOKED';

export interface CreateAuthorizationRequest {
  documentIds: string[];
  recipient: string;
  purpose: string;
  expirationDate?: Date;
  permissions: DocumentPermission[];
}

export interface RevokeAuthorizationRequest {
  authorizationId: string;
  reason: string;
}

// Domain constants
export const MAX_INACTIVITY_TIME_MS = 15 * 60 * 1000; // 15 minutes
export const MFA_TYPE_LABELS: Record<MFAType, string> = {
  BIOMETRIC: 'Biometric (Fingerprint/Face)',
  DIGITAL_CERTIFICATE: 'Digital Certificate',
  OTP: 'One-Time Password (OTP)',
};

