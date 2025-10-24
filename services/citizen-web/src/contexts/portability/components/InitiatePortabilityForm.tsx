/**
 * Initiate Portability Form Component
 * Form to start operator portability process
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { SwapHoriz as TransferIcon } from '@mui/icons-material';
import { useInitiatePortability } from '../hooks';
import { OperatorSelector } from './OperatorSelector';
import { PORTABILITY_DEADLINE_HOURS } from '../domain/types';

interface InitiatePortabilityFormProps {
  onSuccess?: (portabilityId: string) => void;
  onCancel?: () => void;
}

export const InitiatePortabilityForm: React.FC<InitiatePortabilityFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { initiatePortability, isLoading, error, data } = useInitiatePortability();
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = () => {
    if (!selectedOperatorId) {
      return;
    }
    setConfirmDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!termsAccepted) {
      return;
    }

    try {
      await initiatePortability({
        destinationOperatorId: selectedOperatorId,
        confirmation: true,
      });
      setConfirmDialogOpen(false);
    } catch (err) {
      setConfirmDialogOpen(false);
    }
  };

  const handleCancel = () => {
    setConfirmDialogOpen(false);
    setTermsAccepted(false);
  };

  if (data) {
    return (
      <Box>
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body1" fontWeight="medium" gutterBottom>
            Portability Process Initiated!
          </Typography>
          <Typography variant="body2">{data.message}</Typography>
          <Typography variant="body2" mt={1}>
            Process ID: {data.portabilityId}
          </Typography>
          <Typography variant="body2">
            Deadline: {new Date(data.deadline).toLocaleString()}
          </Typography>
        </Alert>
        <Button variant="contained" onClick={() => onSuccess?.(data.portabilityId)}>
          View Progress
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Initiate Operator Portability
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Transfer your documents to a different operator. The process must complete within{' '}
        {PORTABILITY_DEADLINE_HOURS} hours.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight="medium" gutterBottom>
          Important Information:
        </Typography>
        <Typography variant="body2" component="div">
          • The portability process takes up to {PORTABILITY_DEADLINE_HOURS} hours
        </Typography>
        <Typography variant="body2" component="div">
          • Your folder will be temporarily unavailable during the transfer
        </Typography>
        <Typography variant="body2" component="div">
          • All certified and temporary documents will be transferred
        </Typography>
        <Typography variant="body2" component="div">
          • You cannot cancel once the transfer begins
        </Typography>
      </Alert>

      <Box mb={4}>
        <OperatorSelector
          onSelectOperator={setSelectedOperatorId}
          selectedOperatorId={selectedOperatorId}
        />
      </Box>

      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          startIcon={<TransferIcon />}
          onClick={handleSubmit}
          disabled={!selectedOperatorId || isLoading}
          fullWidth
        >
          Initiate Portability
        </Button>
        {onCancel && (
          <Button variant="outlined" onClick={onCancel} disabled={isLoading} fullWidth>
            Cancel
          </Button>
        )}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCancel}>
        <DialogTitle>Confirm Operator Portability</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to initiate a portability process to transfer all your documents to a new operator.
            This process cannot be reversed once started.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 'medium' }}>
            Key Points:
          </DialogContentText>
          <DialogContentText component="div">
            • Process duration: Up to {PORTABILITY_DEADLINE_HOURS} hours
            <br />
            • Your folder will be temporarily inaccessible
            <br />
            • All documents will be transferred
            <br />• This action cannot be undone
          </DialogContentText>

          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
            }
            label="I understand and accept these terms"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            color="primary"
            variant="contained"
            disabled={!termsAccepted || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <TransferIcon />}
          >
            {isLoading ? 'Initiating...' : 'Confirm & Start'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

