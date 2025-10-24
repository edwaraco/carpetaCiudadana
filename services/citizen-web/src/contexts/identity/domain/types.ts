/**
 * Bounded Context: Identity and Registration
 * Domain types for citizen identity management
 */

export interface Citizen {
  cedula: string;
  fullName: string;
  address: string;
  personalEmail: string; // Personal email for notifications
  folderEmail: string; // Immutable: firstname.lastname.cedula@carpetacolombia.co
  currentOperator: string;
  registrationDate: Date;
  status: CitizenStatus;
}

export type CitizenStatus = 'ACTIVE' | 'SUSPENDED' | 'IN_TRANSIT';

export interface RegisterCitizenRequest {
  cedula: string;
  fullName: string;
  address: string;
  personalEmail: string;
}

export interface RegisterCitizenResponse {
  citizen: Citizen;
  folderEmail: string;
  message: string;
}

export interface IdentityVerification {
  verifiedBy: string; // Verification entity (e.g., Registraduría)
  verificationDate: Date;
  verificationNumber: string;
  isValid: boolean;
}

export interface ValidateCitizenRequest {
  cedula: string;
}

export interface ValidateCitizenResponse {
  exists: boolean;
  available: boolean;
  currentOperator?: string;
}

