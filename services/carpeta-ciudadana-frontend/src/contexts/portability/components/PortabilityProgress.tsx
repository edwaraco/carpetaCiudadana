/**
 * Portability Progress Component
 * Displays current portability process status with phase breakdown
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Chip,
  Grid,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  Error as ErrorIcon,
  Sync as InProgressIcon,
} from '@mui/icons-material';
import { PortabilityProcess, PortabilityStatus, PhaseStatus } from '../domain/types';
import { portabilityService } from '../infrastructure';

interface PortabilityProgressProps {
  portabilityId: string;
  onCancel?: () => void;
  onComplete?: () => void;
}

export const PortabilityProgress: React.FC<PortabilityProgressProps> = ({
  portabilityId,
  onCancel,
  onComplete,
}) => {
  const [process, setProcess] = useState<PortabilityProcess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProcess = async () => {
      try {
        const response = await portabilityService.getPortabilityProcess(portabilityId);
        if (response.success && response.data) {
          setProcess(response.data);
          setIsLoading(false);

          // If completed, stop polling
          if (response.data.status === 'COMPLETED' && onComplete) {
            clearInterval(intervalId);
            onComplete();
          }
        } else {
          setError(response.error?.message || 'Failed to fetch process');
          setIsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchProcess();

    // Poll every 5 seconds for updates
    const intervalId = setInterval(fetchProcess, 5000);

    return () => clearInterval(intervalId);
  }, [portabilityId, onComplete]);

  const getStatusColor = (status: PortabilityStatus): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'IN_TRANSIT':
        return 'info';
      default:
        return 'warning';
    }
  };

  const getPhaseIcon = (status: PhaseStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CompletedIcon color="success" />;
      case 'IN_PROGRESS':
        return <InProgressIcon color="primary" />;
      case 'FAILED':
        return <ErrorIcon color="error" />;
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  if (isLoading && !process) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!process) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No portability process found
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Portability Progress</Typography>
          <Chip label={process.status} color={getStatusColor(process.status)} />
        </Box>

        {/* Progress Bar */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {process.details.completionPercentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={process.details.completionPercentage}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Statistics Grid */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="background.default" borderRadius={2}>
              <Typography variant="h5">{process.details.totalDocuments}</Typography>
              <Typography variant="caption" color="text.secondary">
                Total Docs
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="success.light" borderRadius={2}>
              <Typography variant="h5">{process.details.transferredDocuments}</Typography>
              <Typography variant="caption" color="text.secondary">
                Transferred
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="warning.light" borderRadius={2}>
              <Typography variant="h5">{process.details.pendingDocuments}</Typography>
              <Typography variant="caption" color="text.secondary">
                Pending
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="info.light" borderRadius={2}>
              <Typography variant="h5">
                {process.details.remainingTimeHours.toFixed(1)}h
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Remaining
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Transfer Details */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Transfer Details:</strong>
          </Typography>
          <Typography variant="body2">
            From: {process.sourceOperator.operatorName} → To: {process.destinationOperator.operatorName}
          </Typography>
          <Typography variant="body2">
            Deadline: {new Date(process.deadlineDate).toLocaleString()}
          </Typography>
        </Alert>

        {/* Phase Stepper */}
        <Stepper activeStep={process.currentPhase - 1} orientation="vertical">
          {process.phases.map((phase) => (
            <Step key={phase.number} completed={phase.status === 'COMPLETED'}>
              <StepLabel icon={getPhaseIcon(phase.status)}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography>{phase.name}</Typography>
                  {phase.status === 'IN_PROGRESS' && (
                    <CircularProgress size={16} />
                  )}
                </Box>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  {phase.description}
                </Typography>
                {phase.errors && phase.errors.length > 0 && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {phase.errors.join(', ')}
                  </Alert>
                )}
                {phase.completionDate && (
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Completed: {new Date(phase.completionDate).toLocaleString()}
                  </Typography>
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {/* Actions */}
        {process.status !== 'COMPLETED' && process.status !== 'FAILED' && onCancel && (
          <Box mt={3}>
            <Button variant="outlined" color="error" onClick={onCancel}>
              Cancel Portability
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

