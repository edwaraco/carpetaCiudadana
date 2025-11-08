/**
 * Auth Service API Types
 * Types matching the auth-service OpenAPI specification
 */

// ============================================================================
// Request Types (from OpenAPI)
// ============================================================================

export interface AuthServiceLoginRequest {
  document_id: string;
  password: string;
}

export interface AuthServiceRegisterRequest {
  document_id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
}

export interface AuthServiceSetPasswordRequest {
  token: string;
  password: string;
}

// ============================================================================
// Response Types (from OpenAPI)
// ============================================================================

export interface AuthServiceLoginResponse {
  success: boolean;
  message: string;
  token: string;
  expires_at: string; // ISO 8601 date-time string
  document_id: string;
}

export interface AuthServiceRegisterResponse {
  success: boolean;
  message: string;
  document_id: string;
}

export interface AuthServiceSetPasswordResponse {
  success: boolean;
  message: string;
  token: string;
  expires_at: string; // ISO 8601 date-time string
  user: AuthServiceUserProfile;
}

export interface AuthServiceUserProfile {
  document_id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
}

export interface AuthServiceErrorResponse {
  success: false;
  error: string;
  message: string;
}

// Type aliases for better readability
export type {
  AuthServiceRegisterRequest as RegisterApiRequest,
  AuthServiceRegisterResponse as RegisterApiResponse,
  AuthServiceSetPasswordRequest as SetPasswordApiRequest,
  AuthServiceSetPasswordResponse as SetPasswordApiResponse,
};

