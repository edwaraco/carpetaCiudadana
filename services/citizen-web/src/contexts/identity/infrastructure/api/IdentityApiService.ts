/**
 * Identity API Service - Real Implementation
 */

import { httpClient } from '../../../../shared/utils/httpClient';
import { ApiResponse } from '../../../../shared/utils/api.types';
import { IIdentityService } from '../IIdentityService';
import {
  RegisterCitizenRequest,
  RegisterCitizenResponse,
  ValidateCitizenRequest,
  ValidateCitizenResponse,
  Citizen,
} from '../../domain/types';

export class IdentityApiService implements IIdentityService {
  async registerCitizen(request: RegisterCitizenRequest): Promise<ApiResponse<RegisterCitizenResponse>> {
    return httpClient.post<RegisterCitizenResponse>('/identity/register', request);
  }

  async validateCitizen(request: ValidateCitizenRequest): Promise<ApiResponse<ValidateCitizenResponse>> {
    return httpClient.get<ValidateCitizenResponse>(`/identity/validate/${request.cedula}`);
  }

  async getCitizen(cedula: string): Promise<ApiResponse<Citizen>> {
    return httpClient.get<Citizen>(`/identity/citizens/${cedula}`);
  }

  async unregisterCitizen(cedula: string): Promise<ApiResponse<void>> {
    return httpClient.delete<void>(`/identity/citizens/${cedula}`);
  }
}

