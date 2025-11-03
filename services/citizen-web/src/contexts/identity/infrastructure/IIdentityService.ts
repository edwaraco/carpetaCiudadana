/**
 * Identity Service Interface
 * Contract for citizen registration and validation
 */

import { ApiResponse } from '../../../shared/utils/api.types';
import {
  RegisterCitizenRequest,
  RegisterCitizenResponse,
  ValidateCitizenRequest,
  ValidateCitizenResponse,
  Citizen,
} from '../domain/types';

export interface IIdentityService {
  registerCitizen(request: RegisterCitizenRequest): Promise<ApiResponse<RegisterCitizenResponse>>;
  validateCitizen(request: ValidateCitizenRequest): Promise<ApiResponse<ValidateCitizenResponse>>;
  getCitizen(cedula: string): Promise<ApiResponse<Citizen>>;
  unregisterCitizen(cedula: string): Promise<ApiResponse<void>>;
}

