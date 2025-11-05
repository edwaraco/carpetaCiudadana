/**
 * Request Card Component
 * Displays individual document request information
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import {
  Business as EntityIcon,
  CalendarToday as DeadlineIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Cancel as RejectedIcon,
} from '@mui/icons-material';
import { DocumentRequest, RequestStatus, REQUEST_STATUS_LABELS } from '../domain/types';

interface RequestCardProps {
  request: DocumentRequest;
  onViewDetails?: (requestId: string) => void;
  onRespond?: (requestId: string) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onViewDetails,
  onRespond,
}) => {
  const getStatusColor = (
    status: RequestStatus
  ): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'NOTIFIED':
      case 'IN_PROCESS':
        return 'warning';
      case 'REJECTED':
      case 'EXPIRED':
      case 'CANCELLED':
        return 'error';
      case 'CREATED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CompletedIcon fontSize="small" />;
      case 'REJECTED':
      case 'CANCELLED':
        return <RejectedIcon fontSize="small" />;
      default:
        return <PendingIcon fontSize="small" />;
    }
  };

  const canRespond = ['CREATED', 'NOTIFIED', 'IN_PROCESS'].includes(request.requestStatus);
  const isExpired = request.deadline && new Date(request.deadline) < new Date();

  const mandatoryCount = request.requiredDocuments.filter((doc) => doc.mandatory).length;
  const optionalCount = request.requiredDocuments.length - mandatoryCount;

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {request.requestingEntity.businessName}
            </Typography>
            <Chip
              label={REQUEST_STATUS_LABELS[request.requestStatus]}
              color={getStatusColor(request.requestStatus)}
              size="small"
              icon={getStatusIcon(request.requestStatus)}
            />
          </Box>
          {isExpired && (
            <Chip label="Expired" color="error" size="small" />
          )}
        </Box>

        {/* Entity Info */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <EntityIcon fontSize="small" color="action" />
          <Box>
            <Typography variant="caption" color="text.secondary">
              NIT
            </Typography>
            <Typography variant="body2">{request.requestingEntity.nit}</Typography>
          </Box>
        </Box>

        {/* Purpose */}
        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>Purpose:</strong> {request.purpose}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Required Documents */}
        <Typography variant="body2" fontWeight="medium" gutterBottom>
          Required Documents:
        </Typography>
        <Stack spacing={1} mb={2}>
          {request.requiredDocuments.map((doc) => (
            <Box key={doc.id} display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                • {doc.documentType} {doc.mandatory && <span style={{ color: 'red' }}>*</span>}
              </Typography>
              <Chip
                label={doc.deliveryStatus}
                size="small"
                color={doc.deliveryStatus === 'DELIVERED' ? 'success' : 'default'}
                variant="outlined"
              />
            </Box>
          ))}
        </Stack>

        <Typography variant="caption" color="text.secondary">
          {mandatoryCount} mandatory, {optionalCount} optional
        </Typography>

        {/* Deadline */}
        {request.deadline && (
          <Box display="flex" alignItems="center" gap={1} mt={2}>
            <DeadlineIcon fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Deadline
              </Typography>
              <Typography variant="body2" color={isExpired ? 'error' : 'inherit'}>
                {new Date(request.deadline).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Creation Date */}
        <Typography variant="caption" color="text.secondary" display="block" mt={2}>
          Received: {new Date(request.creationDate).toLocaleDateString()}
        </Typography>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button size="small" onClick={() => onViewDetails?.(request.requestId)}>
          View Details
        </Button>
        {canRespond && onRespond && (
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => onRespond(request.requestId)}
          >
            Respond
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

