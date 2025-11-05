/**
 * Portability Mock Service
 * Simulates portability/operator transfer for development/testing
 */

import { ApiResponse } from '../../../../shared/utils/api.types';
import { IPortabilityService } from '../IPortabilityService';
import {
  Operator,
  PortabilityProcess,
  InitiatePortabilityRequest,
  InitiatePortabilityResponse,
  CheckPortabilityResponse,
  PORTABILITY_DEADLINE_HOURS,
  PORTABILITY_PHASES,
  PhaseStatus,
} from '../../domain/types';

export class PortabilityMockService implements IPortabilityService {
  private mockOperators: Operator[] = [
    {
      operatorId: 'op-micarpeta',
      operatorName: 'Mi Carpeta',
      transferAPIURL: 'https://api.micarpeta.co/transfer',
      description: 'Leading citizen folder operator in Colombia',
      active: true,
    },
    {
      operatorId: 'op-govcarpeta',
      operatorName: 'GovCarpeta',
      transferAPIURL: 'https://api.govcarpeta.gov.co/transfer',
      description: 'Government-backed folder operator',
      active: true,
    },
    {
      operatorId: 'op-digitalfolder',
      operatorName: 'Digital Folder Pro',
      transferAPIURL: 'https://api.digitalfolderpro.com/transfer',
      description: 'Enterprise-grade document management',
      active: true,
    },
  ];

  private currentOperatorId = 'op-micarpeta';
  private currentPortability: PortabilityProcess | null = null;

  async getOperators(): Promise<ApiResponse<Operator[]>> {
    await this.simulateDelay();

    // Filter out current operator
    const availableOperators = this.mockOperators.filter(
      (op) => op.operatorId !== this.currentOperatorId && op.active
    );

    return {
      success: true,
      data: availableOperators,
      timestamp: new Date(),
    };
  }

  async checkPortabilityStatus(): Promise<ApiResponse<CheckPortabilityResponse>> {
    await this.simulateDelay(400);

    // If there's an ongoing portability, return it
    if (this.currentPortability && this.currentPortability.status !== 'COMPLETED' && this.currentPortability.status !== 'FAILED') {
      return {
        success: true,
        data: {
          process: this.currentPortability,
          canInitiate: false,
          blockReason: 'There is already an ongoing portability process',
        },
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      data: {
        process: this.currentPortability!,
        canInitiate: true,
      },
      timestamp: new Date(),
    };
  }

  async initiatePortability(
    request: InitiatePortabilityRequest
  ): Promise<ApiResponse<InitiatePortabilityResponse>> {
    await this.simulateDelay(800);

    if (!request.confirmation) {
      return {
        success: false,
        error: {
          code: 'CONFIRMATION_REQUIRED',
          message: 'User must confirm portability request',
          statusCode: 400,
        },
        timestamp: new Date(),
      };
    }

    // Check if there's an ongoing portability
    if (this.currentPortability && this.currentPortability.status !== 'COMPLETED' && this.currentPortability.status !== 'FAILED') {
      return {
        success: false,
        error: {
          code: 'PORTABILITY_IN_PROGRESS',
          message: 'There is already an ongoing portability process',
          statusCode: 409,
        },
        timestamp: new Date(),
      };
    }

    const destOperator = this.mockOperators.find((op) => op.operatorId === request.destinationOperatorId);
    const sourceOperator = this.mockOperators.find((op) => op.operatorId === this.currentOperatorId);

    if (!destOperator || !sourceOperator) {
      return {
        success: false,
        error: {
          code: 'OPERATOR_NOT_FOUND',
          message: 'Destination operator not found',
          statusCode: 404,
        },
        timestamp: new Date(),
      };
    }

    const portabilityId = `port-${Date.now()}`;
    const startDate = new Date();
    const deadlineDate = new Date(startDate.getTime() + PORTABILITY_DEADLINE_HOURS * 60 * 60 * 1000);

    // Create portability process with initial phase in progress
    this.currentPortability = {
      portabilityId,
      citizen: '1234567890',
      sourceOperator,
      destinationOperator: destOperator,
      status: 'INITIATED',
      startDate,
      deadlineDate,
      currentPhase: 1,
      phases: [
        {
          ...PORTABILITY_PHASES[1],
          status: 'IN_PROGRESS' as PhaseStatus,
          startDate,
        },
        {
          ...PORTABILITY_PHASES[2],
          status: 'PENDING' as PhaseStatus,
        },
        {
          ...PORTABILITY_PHASES[3],
          status: 'PENDING' as PhaseStatus,
        },
        {
          ...PORTABILITY_PHASES[4],
          status: 'PENDING' as PhaseStatus,
        },
      ],
      details: {
        totalDocuments: 3,
        transferredDocuments: 0,
        pendingDocuments: 3,
        completionPercentage: 0,
        elapsedTimeHours: 0,
        remainingTimeHours: PORTABILITY_DEADLINE_HOURS,
      },
    };

    return {
      success: true,
      data: {
        portabilityId,
        deadline: deadlineDate,
        message: `Portability process initiated. You have ${PORTABILITY_DEADLINE_HOURS} hours to complete the transfer.`,
      },
      timestamp: new Date(),
    };
  }

  async getPortabilityProcess(portabilityId: string): Promise<ApiResponse<PortabilityProcess>> {
    await this.simulateDelay(500);

    if (!this.currentPortability || this.currentPortability.portabilityId !== portabilityId) {
      return {
        success: false,
        error: {
          code: 'PORTABILITY_NOT_FOUND',
          message: 'Portability process not found',
          statusCode: 404,
        },
        timestamp: new Date(),
      };
    }

    // Simulate progress
    this.simulateProgress();

    return {
      success: true,
      data: this.currentPortability,
      timestamp: new Date(),
    };
  }

  async cancelPortability(portabilityId: string): Promise<ApiResponse<void>> {
    await this.simulateDelay(600);

    if (!this.currentPortability || this.currentPortability.portabilityId !== portabilityId) {
      return {
        success: false,
        error: {
          code: 'PORTABILITY_NOT_FOUND',
          message: 'Portability process not found',
          statusCode: 404,
        },
        timestamp: new Date(),
      };
    }

    if (this.currentPortability.status === 'COMPLETED') {
      return {
        success: false,
        error: {
          code: 'PORTABILITY_COMPLETED',
          message: 'Cannot cancel a completed portability process',
          statusCode: 400,
        },
        timestamp: new Date(),
      };
    }

    this.currentPortability = null;

    return {
      success: true,
      message: 'Portability process cancelled successfully',
      timestamp: new Date(),
    };
  }

  private simulateProgress() {
    if (!this.currentPortability) return;

    // Simulate incremental progress (this is mock behavior)
    const elapsedMs = Date.now() - this.currentPortability.startDate.getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    this.currentPortability.details.elapsedTimeHours = parseFloat(elapsedHours.toFixed(2));
    this.currentPortability.details.remainingTimeHours = parseFloat(
      (PORTABILITY_DEADLINE_HOURS - elapsedHours).toFixed(2)
    );

    // Simulate phase progression (simplified for mock)
    if (this.currentPortability.currentPhase < 4) {
      const progressPerPhase = 25;
      const completionPercentage = Math.min(
        (this.currentPortability.currentPhase * progressPerPhase) +
        Math.min(20, Math.floor((elapsedHours / PORTABILITY_DEADLINE_HOURS) * 100)),
        100
      );

      this.currentPortability.details.completionPercentage = completionPercentage;
      this.currentPortability.details.transferredDocuments = Math.floor(
        (completionPercentage / 100) * this.currentPortability.details.totalDocuments
      );
      this.currentPortability.details.pendingDocuments =
        this.currentPortability.details.totalDocuments -
        this.currentPortability.details.transferredDocuments;

      // Update status based on completion
      if (completionPercentage >= 100) {
        this.currentPortability.status = 'COMPLETED';
        this.currentPortability.currentPhase = 4;
      } else if (completionPercentage > 25) {
        this.currentPortability.status = 'IN_TRANSIT';
      }
    }
  }

  private simulateDelay(ms: number = 600): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

