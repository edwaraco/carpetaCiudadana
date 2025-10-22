/**
 * Respond Request Dialog Component
 * Dialog for responding to document requests (authorize/reject)
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { CheckCircle as AuthorizeIcon, Cancel as RejectIcon } from '@mui/icons-material';
import { useRespondToRequest } from '../hooks';
import { DocumentRequest, SentDocument } from '../domain/types';
import { requestService } from '../infrastructure';

interface RespondRequestDialogProps {
  open: boolean;
  requestId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RespondRequestDialog: React.FC<RespondRequestDialogProps> = ({
  open,
  requestId,
  onClose,
  onSuccess,
}) => {
  const { respondToRequest, isLoading, error, success } = useRespondToRequest();
  const [request, setRequest] = useState<DocumentRequest | null>(null);
  const [action, setAction] = useState<'AUTHORIZE' | 'REJECT'>('AUTHORIZE');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<Record<string, string>>({});
  const [loadingRequest, setLoadingRequest] = useState(false);

  useEffect(() => {
    if (requestId && open) {
      fetchRequest();
    }
  }, [requestId, open]);

  useEffect(() => {
    if (success) {
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    }
  }, [success]);

  const fetchRequest = async () => {
    if (!requestId) return;

    setLoadingRequest(true);
    try {
      const response = await requestService.getRequest(requestId);
      if (response.success && response.data) {
        setRequest(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch request:', err);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleClose = () => {
    setAction('AUTHORIZE');
    setRejectionReason('');
    setSelectedDocuments({});
    setRequest(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!requestId) return;

    if (action === 'REJECT' && !rejectionReason.trim()) {
      return;
    }

    if (action === 'AUTHORIZE') {
      // Check that all mandatory documents have been selected
      const mandatoryDocs = request?.requiredDocuments.filter((doc) => doc.mandatory) || [];
      const missingDocs = mandatoryDocs.filter((doc) => !selectedDocuments[doc.id]);

      if (missingDocs.length > 0) {
        return;
      }
    }

    const sentDocuments: SentDocument[] = Object.entries(selectedDocuments).map(
      ([requiredDocumentId, documentId]) => ({
        requiredDocumentId,
        documentId,
      })
    );

    try {
      await respondToRequest({
        requestId,
        action,
        sentDocuments: action === 'AUTHORIZE' ? sentDocuments : undefined,
        rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
      });
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleDocumentSelect = (requiredDocId: string, documentId: string) => {
    setSelectedDocuments((prev) => ({
      ...prev,
      [requiredDocId]: documentId,
    }));
  };

  if (loadingRequest) {
    return (
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!request) {
    return null;
  }

  const mandatoryDocs = request.requiredDocuments.filter((doc) => doc.mandatory);
  const allMandatorySelected = mandatoryDocs.every((doc) => selectedDocuments[doc.id]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Respond to Document Request</DialogTitle>
      <DialogContent>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Request {action === 'AUTHORIZE' ? 'authorized' : 'rejected'} successfully!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Request Info */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            {request.requestingEntity.businessName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {request.purpose}
          </Typography>
        </Box>

        {/* Action Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="action-select-label">Action</InputLabel>
          <Select
            labelId="action-select-label"
            id="action-select"
            value={action}
            onChange={(e) => setAction(e.target.value as 'AUTHORIZE' | 'REJECT')}
            label="Action"
          >
            <MenuItem value="AUTHORIZE">Authorize - Send Documents</MenuItem>
            <MenuItem value="REJECT">Reject - Decline Request</MenuItem>
          </Select>
        </FormControl>

        {action === 'AUTHORIZE' && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Select Documents to Send:
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              You need to select documents for all mandatory requirements.
            </Alert>

            <List>
              {request.requiredDocuments.map((reqDoc) => (
                <ListItem key={reqDoc.id} sx={{ flexDirection: 'column', alignItems: 'start' }}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1">
                          {reqDoc.documentType}
                          {reqDoc.mandatory && <span style={{ color: 'red' }}> *</span>}
                        </Typography>
                      </Box>
                    }
                    secondary={reqDoc.specifications}
                  />
                  <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                    <InputLabel id={`document-select-label-${reqDoc.id}`}>Select Document</InputLabel>
                    <Select
                      labelId={`document-select-label-${reqDoc.id}`}
                      id={`document-select-${reqDoc.id}`}
                      value={selectedDocuments[reqDoc.id] || ''}
                      onChange={(e) => handleDocumentSelect(reqDoc.id, e.target.value)}
                      label="Select Document"
                      required={reqDoc.mandatory}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {/* In a real app, this would fetch user's documents filtered by type */}
                      <MenuItem value="doc-001">Document 001 (Sample)</MenuItem>
                      <MenuItem value="doc-002">Document 002 (Sample)</MenuItem>
                      <MenuItem value="doc-003">Document 003 (Sample)</MenuItem>
                    </Select>
                  </FormControl>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {action === 'REJECT' && (
          <TextField
            label="Rejection Reason"
            multiline
            rows={4}
            fullWidth
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            error={!rejectionReason.trim() && isLoading}
            helperText="Please provide a reason for rejecting this request"
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={action === 'AUTHORIZE' ? 'primary' : 'error'}
          disabled={
            isLoading ||
            (action === 'AUTHORIZE' && !allMandatorySelected) ||
            (action === 'REJECT' && !rejectionReason.trim())
          }
          startIcon={
            isLoading ? (
              <CircularProgress size={20} />
            ) : action === 'AUTHORIZE' ? (
              <AuthorizeIcon />
            ) : (
              <RejectIcon />
            )
          }
        >
          {isLoading ? 'Processing...' : action === 'AUTHORIZE' ? 'Authorize & Send' : 'Reject Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

