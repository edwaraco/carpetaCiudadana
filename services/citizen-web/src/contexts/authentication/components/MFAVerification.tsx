/**
 * MFAVerification Component
 * Handles Multi-Factor Authentication verification (OPTIONAL)
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Fingerprint, QrCode, Password } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { MFA_TYPE_LABELS } from '../domain/types';

interface MFAVerificationProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  allowSkip?: boolean; // New: Allow skipping MFA
}

export const MFAVerification: React.FC<MFAVerificationProps> = ({
  onSuccess,
  onCancel,
  allowSkip = false,
}) => {
  const { verifyMFA, isLoading, error, user } = useAuth();
  const [mfaCode, setMfaCode] = useState('');
  const [mfaType, setMfaType] = useState<'BIOMETRIC' | 'DIGITAL_CERTIFICATE' | 'OTP'>('OTP');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mfaCode.length !== 6) {
      return;
    }

    await verifyMFA(mfaCode, mfaType);

    if (!error) {
      onSuccess?.();
    }
  };

  const handleSkip = () => {
    // Skip MFA and proceed
    onSuccess?.();
  };

  const handleMFATypeChange = (_: React.MouseEvent<HTMLElement>, newType: typeof mfaType | null) => {
    if (newType !== null) {
      setMfaType(newType);
      setMfaCode('');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom align="center">
        Multi-Factor Authentication
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        {user ? `Welcome ${user.fullName}` : 'Please verify your identity'}
      </Typography>

      {allowSkip && (
        <Alert severity="info" sx={{ mb: 2 }}>
          MFA is optional. You can skip this step or verify for additional security.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        {/* MFA Type Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Verification Method
          </Typography>
          <ToggleButtonGroup
            value={mfaType}
            exclusive
            onChange={handleMFATypeChange}
            fullWidth
            disabled={isLoading}
          >
            <ToggleButton value="OTP">
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
                <Password />
                <Typography variant="caption">OTP Code</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="BIOMETRIC">
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
                <Fingerprint />
                <Typography variant="caption">Biometric</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="DIGITAL_CERTIFICATE">
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
                <QrCode />
                <Typography variant="caption">Certificate</Typography>
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* MFA Code Input */}
        <TextField
          fullWidth
          label={`Enter ${MFA_TYPE_LABELS[mfaType]} Code`}
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          disabled={isLoading}
          error={mfaCode.length > 0 && mfaCode.length !== 6}
          helperText={
            mfaCode.length > 0 && mfaCode.length !== 6
              ? 'Code must be 6 digits'
              : 'Enter the 6-digit verification code'
          }
          inputProps={{
            maxLength: 6,
            pattern: '[0-9]*',
            inputMode: 'numeric',
          }}
          sx={{ mb: 3 }}
        />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading || mfaCode.length !== 6}
            startIcon={isLoading && <CircularProgress size={20} />}
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {allowSkip && (
              <Button
                variant="outlined"
                onClick={handleSkip}
                disabled={isLoading}
                fullWidth
              >
                Skip MFA
              </Button>
            )}
            {onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={isLoading}
                fullWidth
              >
                Cancel
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

