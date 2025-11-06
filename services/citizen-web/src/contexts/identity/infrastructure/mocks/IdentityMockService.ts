/**
 * Identity Mock Service
 * Simulates citizen registration and validation
 */

import { ApiResponse } from '../../../../shared/utils/api.types';
import { IIdentityService } from '../IIdentityService';
import {
  RegisterCitizenRequest,
  RegisterCitizenResponse,
  ValidateCitizenRequest,
  ValidateCitizenResponse,
  Citizen,
} from '../../domain/types';

export class IdentityMockService implements IIdentityService {
  // In-memory storage for registered citizens
  private registeredCitizens: Map<string, Citizen> = new Map();

  constructor() {
    // Pre-populate with one test citizen
    const testCitizen: Citizen = {
      cedula: '1234567890',
      fullName: 'Juan Pérez García',
      address: 'Calle 123 #45-67, Medellín',
      personalEmail: 'juan.perez@example.com',
      folderEmail: 'juan.perez.1234567890@carpetacolombia.co',
      currentOperator: 'MiCarpeta',
      registrationDate: new Date('2024-01-15'),
      status: 'ACTIVE',
      carpetaId: 'mock-carpeta-1234567890',
    };
    this.registeredCitizens.set(testCitizen.cedula, testCitizen);
  }

  async registerCitizen(request: RegisterCitizenRequest): Promise<ApiResponse<RegisterCitizenResponse>> {
    await this.simulateDelay();

    // Check if already exists
    if (this.registeredCitizens.has(request.cedula)) {
      return {
        success: false,
        error: {
          code: 'CITIZEN_ALREADY_EXISTS',
          message: 'A citizen with this cedula is already registered',
          statusCode: 409,
        },
        timestamp: new Date(),
      };
    }

    // Generate folder email
    const folderEmail = this.generateFolderEmail(request.fullName, request.cedula);

    const newCitizen: Citizen = {
      cedula: request.cedula,
      fullName: request.fullName,
      address: request.address,
      personalEmail: request.personalEmail,
      folderEmail: folderEmail,
      currentOperator: 'MiCarpeta',
      registrationDate: new Date(),
      status: 'ACTIVE',
      carpetaId: `mock-carpeta-${request.cedula}`,
    };

    // Store in memory
    this.registeredCitizens.set(newCitizen.cedula, newCitizen);

    const response: RegisterCitizenResponse = {
      citizen: newCitizen,
      folderEmail: folderEmail,
      message: `Citizen registered successfully. Your unique folder email is: ${folderEmail}`,
    };

    return {
      success: true,
      data: response,
      message: 'Citizen registered successfully',
      timestamp: new Date(),
    };
  }

  async validateCitizen(request: ValidateCitizenRequest): Promise<ApiResponse<ValidateCitizenResponse>> {
    await this.simulateDelay(500);

    const exists = this.registeredCitizens.has(request.cedula);
    const citizen = this.registeredCitizens.get(request.cedula);

    return {
      success: true,
      data: {
        exists: exists,
        available: !exists,
        currentOperator: citizen?.currentOperator,
      },
      timestamp: new Date(),
    };
  }

  async getCitizen(cedula: string): Promise<ApiResponse<Citizen>> {
    await this.simulateDelay(600);

    const citizen = this.registeredCitizens.get(cedula);

    if (citizen) {
      return {
        success: true,
        data: citizen,
        timestamp: new Date(),
      };
    }

    return {
      success: false,
      error: {
        code: 'CITIZEN_NOT_FOUND',
        message: 'Citizen not found',
        statusCode: 404,
      },
      timestamp: new Date(),
    };
  }

  async unregisterCitizen(cedula: string): Promise<ApiResponse<void>> {
    await this.simulateDelay(700);

    if (this.registeredCitizens.has(cedula)) {
      this.registeredCitizens.delete(cedula);
      return {
        success: true,
        message: 'Citizen unregistered successfully',
        timestamp: new Date(),
      };
    }

    return {
      success: false,
      error: {
        code: 'CITIZEN_NOT_FOUND',
        message: 'Citizen not found',
        statusCode: 404,
      },
      timestamp: new Date(),
    };
  }

  private generateFolderEmail(fullName: string, cedula: string): string {
    const nameParts = fullName.toLowerCase().split(' ').filter(part => part.length > 0);
    const firstName = nameParts[0] || 'citizen';
    const lastName = nameParts[nameParts.length - 1] || 'user';
    return `${firstName}.${lastName}.${cedula}@carpetacolombia.co`;
  }

  private simulateDelay(ms: number = 800): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

