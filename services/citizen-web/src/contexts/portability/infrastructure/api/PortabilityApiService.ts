/**
 * Portability API Service - Real Implementation
 */

import { httpClient } from '../../../../shared/utils/httpClient';
import { ApiResponse } from '../../../../shared/utils/api.types';
import { IPortabilityService } from '../IPortabilityService';
import {
  Operator,
  PortabilityProcess,
  InitiatePortabilityRequest,
  InitiatePortabilityResponse,
  CheckPortabilityResponse,
} from '../../domain/types';

export class PortabilityApiService implements IPortabilityService {
  async getOperators(): Promise<ApiResponse<Operator[]>> {
    return httpClient.get<Operator[]>('/portability/operators');
  }

  async checkPortabilityStatus(): Promise<ApiResponse<CheckPortabilityResponse>> {
    return httpClient.get<CheckPortabilityResponse>('/portability/status');
  }

  async initiatePortability(
    request: InitiatePortabilityRequest
  ): Promise<ApiResponse<InitiatePortabilityResponse>> {
    return httpClient.post<InitiatePortabilityResponse>('/portability/initiate', request);
  }

  async getPortabilityProcess(portabilityId: string): Promise<ApiResponse<PortabilityProcess>> {
    return httpClient.get<PortabilityProcess>(`/portability/process/${portabilityId}`);
  }

  async cancelPortability(portabilityId: string): Promise<ApiResponse<void>> {
    return httpClient.delete<void>(`/portability/process/${portabilityId}`);
  }
}

