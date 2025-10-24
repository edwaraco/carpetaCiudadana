/**
 * Bounded Context: Portability Management
 * Domain types for operator transfer/portability
 */

export interface Operator {
  operatorId: string;
  operatorName: string;
  transferAPIURL: string;
  description?: string;
  logoUrl?: string;
  active: boolean;
}

export interface PortabilityProcess {
  portabilityId: string;
  citizen: string; // Cedula
  sourceOperator: Operator;
  destinationOperator: Operator;
  status: PortabilityStatus;
  startDate: Date;
  deadlineDate: Date; // 72 hours from start
  phases: PortabilityPhase[];
  currentPhase: number;
  details: PortabilityDetails;
}

export type PortabilityStatus =
  | 'INITIATED'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'FAILED';

export interface PortabilityPhase {
  number: 1 | 2 | 3 | 4;
  name: string;
  description: string;
  status: PhaseStatus;
  startDate?: Date;
  completionDate?: Date;
  errors?: string[];
}

export type PhaseStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface PortabilityDetails {
  totalDocuments: number;
  transferredDocuments: number;
  pendingDocuments: number;
  completionPercentage: number;
  elapsedTimeHours: number;
  remainingTimeHours: number;
  errors?: PortabilityError[];
}

export interface PortabilityError {
  code: string;
  message: string;
  phase: number;
  date: Date;
}

export interface InitiatePortabilityRequest {
  destinationOperatorId: string;
  confirmation: boolean;
}

export interface InitiatePortabilityResponse {
  portabilityId: string;
  deadline: Date;
  message: string;
}

export interface CheckPortabilityResponse {
  process: PortabilityProcess;
  canInitiate: boolean;
  blockReason?: string;
}

// Domain constants
export const PORTABILITY_DEADLINE_HOURS = 72;

export const PORTABILITY_PHASES: Record<number, Omit<PortabilityPhase, 'status' | 'startDate' | 'completionDate'>> = {
  1: {
    number: 1,
    name: 'Disaffiliation',
    description: 'Unregister from source operator',
  },
  2: {
    number: 2,
    name: 'P2P Transfer',
    description: 'Direct document transfer between operators',
  },
  3: {
    number: 3,
    name: 'Affiliation',
    description: 'Register with new operator',
  },
  4: {
    number: 4,
    name: 'In-Transit Documents',
    description: 'Handle documents received during portability',
  },
};

