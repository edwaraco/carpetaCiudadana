/**
 * Portability Service Interface
 * Contract for portability/operator transfer operations
 */

import { ApiResponse } from '../../../shared/utils/api.types';
import {
  Operator,
  PortabilityProcess,
  InitiatePortabilityRequest,
  InitiatePortabilityResponse,
  CheckPortabilityResponse,
} from '../domain/types';

export interface IPortabilityService {
  // Get list of available operators
  getOperators(): Promise<ApiResponse<Operator[]>>;

  // Check current portability status
  checkPortabilityStatus(): Promise<ApiResponse<CheckPortabilityResponse>>;

  // Initiate portability process
  initiatePortability(request: InitiatePortabilityRequest): Promise<ApiResponse<InitiatePortabilityResponse>>;

  // Get current portability process details
  getPortabilityProcess(portabilityId: string): Promise<ApiResponse<PortabilityProcess>>;

  // Cancel ongoing portability process
  cancelPortability(portabilityId: string): Promise<ApiResponse<void>>;
}

